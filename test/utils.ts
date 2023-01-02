import { AbiEntry } from "@shardlabs/starknet-hardhat-plugin/dist/src/starknet-types";
import { StarknetContractFactory } from "@shardlabs/starknet-hardhat-plugin/dist/src/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import path from "path";
import { zip } from "lodash";

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
    acc[arg.name!] = input;
    return acc;
  }, {} as any);
}

function toBigInt({ low, high }: { low: bigint; high: bigint }): bigint {
  return low + 2n ** 128n * high;
}

function getResults(res: any, args: Argument[]) {
  const results = args.reduce((acc: any[], { name, type }: AbiEntry) => {
    acc.push(type === "Uint256" ? toBigInt(res[name]) : res[name]);
    return acc;
  }, []);
  return results.length === 1 ? results[0] : results;
}

export function wrap(contract: StarknetContract) {
  return new Proxy(
    {},
    {
      get(_, callName) {
        if (callName === "address") {
          return contract.address;
        }
        const abiEntry = contract.abi[callName];
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
        const cairoFunction: CairoFunction = abiEntry;
        return async (...args: any[]) => {
          const callArgs = getCallArgs(args, cairoFunction.inputs);
          const res = await contract.call(callName, callArgs);
          return getResults(res, cairoFunction.outputs);
        };
      },
    }
  );
}
