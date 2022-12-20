import { StarknetContractFactory } from "@shardlabs/starknet-hardhat-plugin/dist/src/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import path from "path";
import { Contract, number } from "starknet";

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
  const {res} = await hasWards.call("wards", { user: ward.address });
  return res === 1n;
}
