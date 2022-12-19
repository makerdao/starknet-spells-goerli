import { expect } from "earljs";
import { Contract, Provider } from "starknet";
import daiAbi from "../abis/dai_abi.json";
import l2DaiBridgeAbi from "../abis/l2_dai_bridge_abi.json";
import l2DaiTeleportGateway from "../abis/l2_dai_teleport_gateway_abi.json";
import l2GovernanceRelay from "../abis/l2_governance_relay_abi.json";
import {
  L2_DAI_ADDRESS,
  L2_DAI_BRIDGE_ADDRESS,
  L2_DAI_BRIDGE_LEGACY_ADDRESS,
  L2_DAI_TELEPORT_GATEWAY_ADDRESS,
  L2_GOVERNANCE_RELAY_ADDRESS,
  L2_GOVERNANCE_RELAY_LEGACY_ADDRESS,
} from "./addresses";
import { isWard } from "./utils";

export const USER =
  "0x063c94d6B73eA2284338f464f86F33E12642149F763Cd8E76E035E8E6A5Bb0e6";

describe("setup", () => {
  let provider: Provider;
  let dai: Contract;
  let bridge: Contract;
  let bridgeLegacy: Contract;
  let teleport: Contract;
  let relay: Contract;
  let relayLegacy: Contract;

  before(async () => {
    provider = new Provider({
      sequencer: { baseUrl: "http://localhost:5050" },
    });
    dai = new Contract(daiAbi, L2_DAI_ADDRESS, provider);
    bridge = new Contract(l2DaiBridgeAbi, L2_DAI_BRIDGE_ADDRESS, provider);
    bridgeLegacy = new Contract(
      l2DaiBridgeAbi,
      L2_DAI_BRIDGE_LEGACY_ADDRESS,
      provider
    );
    teleport = new Contract(
      l2DaiTeleportGateway,
      L2_DAI_TELEPORT_GATEWAY_ADDRESS,
      provider
    );
    relay = new Contract(
      l2GovernanceRelay,
      L2_GOVERNANCE_RELAY_ADDRESS,
      provider
    );
    relayLegacy = new Contract(
      l2GovernanceRelay,
      L2_GOVERNANCE_RELAY_LEGACY_ADDRESS,
      provider
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
