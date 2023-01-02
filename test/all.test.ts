import { PredeployedAccount } from "@shardlabs/starknet-hardhat-plugin/dist/src/devnet-utils";
import { expect } from "earljs";
import hre from "hardhat";
import {
  L2_DAI_ADDRESS,
  L2_DAI_BRIDGE_ADDRESS,
  L2_DAI_BRIDGE_LEGACY_ADDRESS,
  L2_DAI_TELEPORT_GATEWAY_ADDRESS,
  L2_GOVERNANCE_RELAY_ADDRESS,
  L2_GOVERNANCE_RELAY_LEGACY_ADDRESS,
} from "./addresses";
import { getL2ContractAt, wrap } from "./utils";

export const USER =
  "0x063c94d6B73eA2284338f464f86F33E12642149F763Cd8E76E035E8E6A5Bb0e6";

describe("setup", () => {
  let dai: any;
  let bridge: any;
  let bridgeLegacy: any;
  let teleport: any;
  let relay: any;
  let relayLegacy: any;
  let predeployedAccounts: PredeployedAccount[];

  before(async () => {
    dai = wrap(
      await getL2ContractAt(hre, "test/abis/dai_abi.json", L2_DAI_ADDRESS)
    );
    bridge = wrap(
      await getL2ContractAt(
        hre,
        "test/abis/l2_dai_bridge_abi.json",
        L2_DAI_BRIDGE_ADDRESS
      )
    );
    bridgeLegacy = wrap(
      await getL2ContractAt(
        hre,
        "test/abis/l2_dai_bridge_abi.json",
        L2_DAI_BRIDGE_LEGACY_ADDRESS
      )
    );
    teleport = wrap(
      await getL2ContractAt(
        hre,
        "test/abis/l2_dai_teleport_gateway_abi.json",
        L2_DAI_TELEPORT_GATEWAY_ADDRESS
      )
    );
    relay = wrap(
      await getL2ContractAt(
        hre,
        "test/abis/l2_governance_relay_abi.json",
        L2_GOVERNANCE_RELAY_ADDRESS
      )
    );
    relayLegacy = wrap(
      await getL2ContractAt(
        hre,
        "test/abis/l2_governance_relay_abi.json",
        L2_GOVERNANCE_RELAY_LEGACY_ADDRESS
      )
    );
    predeployedAccounts = await hre.starknet.devnet.getPredeployedAccounts();
  });

  describe("dai", () => {
    it("has proper wards", async () => {
      expect(await dai.wards(bridge.address)).toBeTruthy();
      expect(await dai.wards(relay.address)).toBeTruthy();
      expect(await dai.wards(bridgeLegacy.address)).toBeTruthy();
      expect(await dai.wards(relayLegacy.address)).toBeTruthy();
    });
  });
  describe("bridge", () => {
    it("has proper wards", async () => {
      expect(await bridge.wards(relay.address)).toBeTruthy();
      expect(await bridge.wards(relayLegacy.address)).toBeTruthy();
    });
    it("handles deposits", async () => {
      const l1Bridge = `0x${(await bridge.bridge()).toString(16)}`;
      const recipient = predeployedAccounts[0].address;
      const selector =
        "0x2d757788a8d8d6f21d1cd40bce38a8222d70654214e96ff95d8086e684fbee5";
      const balanceBeforeDeposit: bigint = await dai.balanceOf(recipient);
      const amount = 100n;

      const body = {
        l2_contract_address: bridge.address,
        entry_point_selector: selector,
        l1_contract_address: l1Bridge,
        payload: [recipient, `0x${amount.toString(16)}`, "0x0", "0x0"],
        nonce: "0x0",
      };

      await hre.starknet.devnet.requestHandler(
        "/postman/send_message_to_l2",
        "POST",
        body
      );

      const balanceAfterDeposit: bigint = await dai.balanceOf(recipient);

      expect(balanceBeforeDeposit + amount).toEqual(balanceAfterDeposit);
    });
  });
  describe("teleport", () => {
    it("has proper wards", async () => {
      expect(await teleport.wards(relay.address)).toBeTruthy();
      expect(await teleport.wards(relayLegacy.address)).toBeTruthy();
    });
  });
});
