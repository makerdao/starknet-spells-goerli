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

function getCallArgs(inputs, args) {
  return zip(inputs, args).reduce((result, [abi, arg]: any[]) => {
    if (abi === undefined || arg === undefined) {
      throw new Error(`Can't evaluate....`);
    }
    result[abi.name!] = arg;
    return result;
  }, {} as any);
}

export function wrap(contract: StarknetContract) {
  return new Proxy(
    {},
    {
      get(_, callName) {
        if (callName === "address") {
          return contract.address;
        }
        // console.log(callName, contract.abi[callName]);
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
          const callArgs = getCallArgs(cairoFunction.inputs, args);
          const res = await contract.call(callName, callArgs);

          const results = cairoFunction.outputs.reduce(
            (result: any, { name }: AbiEntry) => {
              result[result.length] = res[name];
              return result;
            },
            []
          );
          return results.length === 1 ? results[0] : results;
        };
      },
    }
  );
}
