import {
  AbiEntry,
  CairoFunction,
} from "@shardlabs/starknet-hardhat-plugin/dist/src/starknet-types";
import {
  InvokeOptions,
  StarknetContract,
  StarknetContractFactory,
} from "@shardlabs/starknet-hardhat-plugin/dist/src/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import path from "path";
import { zip } from "lodash";
import { Account } from "@shardlabs/starknet-hardhat-plugin/dist/src/account";

export async function getL2ContractAt(
  hre: HardhatRuntimeEnvironment,
  abiPath: string,
  address: string
) {
  const factory = new StarknetContractFactory({
    hre,
    abiPath: path.join(process.env.PWD!, abiPath),
    metadataPath: "", //ignored
  });
  return factory.getContractAt(address);
}

export async function isWard(
  hasWards: StarknetContract,
  ward: StarknetContract
): Promise<boolean> {
  const { res } = await hasWards.call("wards", { user: ward.address });
  return res === 1n;
}

function getCallArgs(inputs: any[], args: Argument[]) {
  return zip(inputs, args).reduce((acc, [input, arg]) => {
    if (input === undefined || arg === undefined) {
      throw new Error(`Can't evaluate....`);
    }
    acc[arg.name!] = arg.type === "Uint256" ? toUint256(input) : input;
    return acc;
  }, {} as any);
}

function toBigInt({ low, high }: { low: bigint; high: bigint }): bigint {
  return low + 2n ** 128n * high;
}

function toUint256(v: bigint): { low: bigint; high: bigint } {
  const bits = v.toString(16).padStart(64, "0");
  return {
    low: BigInt(`0x${bits.slice(32)}`),
    high: BigInt(`0x${bits.slice(0, 32)}`),
  };
}

function getResults(res: any, args: Argument[]) {
  const results = args.reduce((acc: any[], { name, type }: AbiEntry) => {
    acc.push(type === "Uint256" ? toBigInt(res[name]) : res[name]);
    return acc;
  }, []);
  return results.length === 1 ? results[0] : results;
}

function getOptions(...args: any[]): InvokeOptions | undefined {
  if (
    args.length > 0 &&
    ("maxFee" in args[args.length - 1] || "nonce" in args[args.length - 1])
  ) {
    return args[args.length - 1] as InvokeOptions;
  }
  return undefined;
}

export function wrap(hre: any, contract: StarknetContract) {
  let connectedAccount: Account;
  return new Proxy(
    {},
    {
      get(_, _callName) {
        const callName = _callName.toString();
        if (callName === "address") {
          return contract.address;
        }

        if (callName === "connect") {
          return (account: Account) => {
            connectedAccount = account;
          };
        }

        const abiEntry = contract.getAbi()[callName];

        if (!abiEntry) {
          throw new Error(
            `Can't evaluate: ${callName} in contract ${contract.address}`
          );
        }
        if (abiEntry.type != "function") {
          throw new Error(
            `Can't evaluate a non function: ${callName} in contract ${contract.address}`
          );
        }
        const cairoFunction = abiEntry as CairoFunction;
        return async (...args: any[]) => {
          if (cairoFunction.stateMutability === "view") {
            const res = await contract.call(
              callName,
              getCallArgs(args, cairoFunction.inputs)
            );
            return getResults(res, cairoFunction.outputs);
          } else {
            if (!connectedAccount) {
              throw new Error(
                `No account connected to contract ${contract.address}`
              );
            }

            const parameters: Parameters<typeof connectedAccount.invoke> = [
              contract,
              callName,
              getCallArgs(args, cairoFunction.inputs),
            ];
            if (getOptions(args)) {
              parameters.push(getOptions(args));
            }

            const txHash = await connectedAccount.invoke(...parameters);
            return await hre.starknet.getTransactionReceipt(txHash);
          }
        };
      },
    }
  );
}
