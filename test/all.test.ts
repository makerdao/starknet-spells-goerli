import { Account } from "@shardlabs/starknet-hardhat-plugin/dist/src/account";
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
  let predeployedAccounts: Account[];

  before(async () => {
    dai = wrap(
      hre,
      await getL2ContractAt(hre, "test/abis/dai_abi.json", L2_DAI_ADDRESS)
    );
    bridge = wrap(
      hre,
      await getL2ContractAt(
        hre,
        "test/abis/l2_dai_bridge_abi.json",
        L2_DAI_BRIDGE_ADDRESS
      )
    );
    bridgeLegacy = wrap(
      hre,
      await getL2ContractAt(
        hre,
        "test/abis/l2_dai_bridge_abi.json",
        L2_DAI_BRIDGE_LEGACY_ADDRESS
      )
    );
    teleport = wrap(
      hre,
      await getL2ContractAt(
        hre,
        "test/abis/l2_dai_teleport_gateway_abi.json",
        L2_DAI_TELEPORT_GATEWAY_ADDRESS
      )
    );
    relay = wrap(
      hre,
      await getL2ContractAt(
        hre,
        "test/abis/l2_governance_relay_abi.json",
        L2_GOVERNANCE_RELAY_ADDRESS
      )
    );
    relayLegacy = wrap(
      hre,
      await getL2ContractAt(
        hre,
        "test/abis/l2_governance_relay_abi.json",
        L2_GOVERNANCE_RELAY_LEGACY_ADDRESS
      )
    );

    predeployedAccounts = [];
    for (const {
      address,
      private_key,
    } of await hre.starknet.devnet.getPredeployedAccounts()) {
      const account =
        await hre.starknet.OpenZeppelinAccount.getAccountFromAddress(
          address,
          private_key
        );
      predeployedAccounts.push(await account);
    }
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
    it("handles deposits and widthdrawals", async () => {
      const l1Bridge = `0x${(await bridge.bridge()).toString(16)}`;
      const recipient = predeployedAccounts[0];
      const selector =
        "0x2d757788a8d8d6f21d1cd40bce38a8222d70654214e96ff95d8086e684fbee5";
      const balanceBefore: bigint = await dai.balanceOf(recipient.address);
      const amount = 100n;
      const body = {
        l2_contract_address: bridge.address,
        entry_point_selector: selector,
        l1_contract_address: l1Bridge,
        payload: [recipient.address, `0x${amount.toString(16)}`, "0x0", "0x0"],
        nonce: "0x0",
      };
      await hre.starknet.devnet.requestHandler(
        "/postman/send_message_to_l2",
        "POST",
        body
      );

      const balanceAfter: bigint = await dai.balanceOf(recipient.address);

      expect(balanceBefore + amount).toEqual(balanceAfter);

      dai.connect(recipient);
      await dai.increaseAllowance(bridge.address, balanceAfter)

      bridge.connect(recipient);

      const { status } = await bridge.initiate_withdraw(1, balanceAfter);
      expect(status).toEqual("ACCEPTED_ON_L2");

      const balanceAfterWidthdrawal: bigint = await dai.balanceOf(
        recipient.address
      );
      expect(balanceAfterWidthdrawal).toEqual(0n);
    });
  });
  describe("teleport", () => {
    it("has proper wards", async () => {
      expect(await teleport.wards(relay.address)).toBeTruthy();
      expect(await teleport.wards(relayLegacy.address)).toBeTruthy();
    });
  });
});
