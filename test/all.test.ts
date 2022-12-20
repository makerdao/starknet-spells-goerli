import { StarknetContractFactory } from "@shardlabs/starknet-hardhat-plugin/dist/src/types";
import { expect } from "earljs";
import { HardhatRuntimeEnvironment, StarknetContract } from "hardhat/types";
import daiAbi from "./abis/dai_abi.json";
import l2DaiBridgeAbi from "./abis/l2_dai_bridge_abi.json";
import l2DaiTeleportGateway from "./abis/l2_dai_teleport_gateway_abi.json";
import l2GovernanceRelay from "./abis/l2_governance_relay_abi.json";
import hre from "hardhat";
import {
  L2_DAI_ADDRESS,
  L2_DAI_BRIDGE_ADDRESS,
  L2_DAI_BRIDGE_LEGACY_ADDRESS,
  L2_DAI_TELEPORT_GATEWAY_ADDRESS,
  L2_GOVERNANCE_RELAY_ADDRESS,
  L2_GOVERNANCE_RELAY_LEGACY_ADDRESS,
} from "./addresses";
import { getL2ContractAt, isWard } from "./utils";

export const USER =
  "0x063c94d6B73eA2284338f464f86F33E12642149F763Cd8E76E035E8E6A5Bb0e6";

describe("setup", () => {
  let dai: StarknetContract;
  let bridge: StarknetContract;
  let bridgeLegacy: StarknetContract;
  let teleport: StarknetContract;
  let relay: StarknetContract;
  let relayLegacy: StarknetContract;

  before(async () => {
    dai = await getL2ContractAt(hre, "test/abis/dai_abi.json", L2_DAI_ADDRESS);
    bridge = await getL2ContractAt(
      hre,
      "test/abis/l2_dai_bridge_abi.json",
      L2_DAI_BRIDGE_ADDRESS
    );
    bridgeLegacy = await getL2ContractAt(
      hre,
      "test/abis/l2_dai_bridge_abi.json",
      L2_DAI_BRIDGE_LEGACY_ADDRESS
    );
    teleport = await getL2ContractAt(
      hre,
      "test/abis/l2_dai_teleport_gateway_abi.json",
      L2_DAI_TELEPORT_GATEWAY_ADDRESS
    );
    relay = await getL2ContractAt(
      hre,
      "test/abis/l2_governance_relay_abi.json",
      L2_GOVERNANCE_RELAY_ADDRESS
    );
    relayLegacy = await getL2ContractAt(
      hre,
      "test/abis/l2_governance_relay_abi.json",
      L2_GOVERNANCE_RELAY_LEGACY_ADDRESS
    );
  });

  describe("dai", () => {
    it("authorizations", async () => {
      expect(await isWard(dai, bridge)).toBeTruthy();
      expect(await isWard(dai, relay)).toBeTruthy();
      expect(await isWard(dai, bridgeLegacy)).toBeTruthy();
      expect(await isWard(dai, relayLegacy)).toBeTruthy();
    });
  });
  describe("bridge", () => {
    it("authorizations", async () => {
      expect(await isWard(bridge, relay)).toBeTruthy();
      expect(await isWard(bridge, relayLegacy)).toBeTruthy();
    });
  });
  describe("teleport", () => {
    it("authorizations", async () => {
      expect(await isWard(teleport, relay)).toBeTruthy();
      expect(await isWard(teleport, relayLegacy)).toBeTruthy();
    });
  });
});
