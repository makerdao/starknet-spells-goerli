import { StarknetContractFactory } from "@shardlabs/starknet-hardhat-plugin/dist/src/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import path from "path";

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
