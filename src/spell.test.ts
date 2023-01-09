import { Account } from "@shardlabs/starknet-hardhat-plugin/dist/src/account";
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
import { getL2ContractAt } from "./utils/utils";
import daiAbi from "./abis/daiAbi";
import { WrappedStarknetContract, wrapTyped } from "./utils/wrap";
import l2DaiBridgeAbi from "./abis/l2DaiBridgeAbi";
import l2DaiTeleportGatewayAbi from "./abis/l2DaiTeleportGatewayAbi";
import l2GovernanceRelayAbi from "./abis/l2GovernanceRelayAbi";

describe("setup", () => {
  let dai: WrappedStarknetContract<typeof daiAbi>;
  let bridge: WrappedStarknetContract<typeof l2DaiBridgeAbi>;
  let bridgeLegacy: WrappedStarknetContract<typeof l2DaiBridgeAbi>;
  let teleport: WrappedStarknetContract<typeof l2DaiTeleportGatewayAbi>;
  let relay: WrappedStarknetContract<typeof l2GovernanceRelayAbi>;
  let relayLegacy: WrappedStarknetContract<typeof l2GovernanceRelayAbi>;
  let predeployedAccounts: Account[];
  before(async () => {
    dai = wrapTyped(
      hre,
      await getL2ContractAt(hre, "src/abis/dai_abi.json", L2_DAI_ADDRESS)
    );
    bridge = wrapTyped(
      hre,
      await getL2ContractAt(
        hre,
        "src/abis/l2_dai_bridge_abi.json",
        L2_DAI_BRIDGE_ADDRESS
      )
    );
    bridgeLegacy = wrapTyped(
      hre,
      await getL2ContractAt(
        hre,
        "src/abis/l2_dai_bridge_abi.json",
        L2_DAI_BRIDGE_LEGACY_ADDRESS
      )
    );
    teleport = wrapTyped(
      hre,
      await getL2ContractAt(
        hre,
        "src/abis/l2_dai_teleport_gateway_abi.json",
        L2_DAI_TELEPORT_GATEWAY_ADDRESS
      )
    );
    relay = wrapTyped(
      hre,
      await getL2ContractAt(
        hre,
        "src/abis/l2_governance_relay_abi.json",
        L2_GOVERNANCE_RELAY_ADDRESS
      )
    );
    relayLegacy = wrapTyped(
      hre,
      await getL2ContractAt(
        hre,
        "src/abis/l2_governance_relay_abi.json",
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
      predeployedAccounts.push(account);
    }

    // TODO: does not work yet, waiting for shardlabs
    // await hre.run("starknet-compile", { paths: ["src/spell.cairo"] });
    //
    // const spellDeployer = predeployedAccounts[0];
    // const spellFactory = await hre.starknet.getContractFactory("spell");
    // await spellDeployer.declare(spellFactory);
    // const spell = await spellDeployer.deploy(spellFactory, {});
    // // @ts-ignore
    // const {
    //   data: { transaction_hash },
    // } = await hre.starknet.devnet.requestHandler(
    //   "/postman/send_message_to_l2",
    //   "POST",
    //   {
    //     l2_contract_address: relay.address,
    //     entry_point_selector:
    //       "0xa9ebda8d3a6595cf15b1d46ea0e440a9810c2b99a3e889c6b3b46f7ff0e5e1",
    //     l1_contract_address: L1_GOVERNANCE_RELAY_ADDRESS,
    //     payload: [spell.address],
    //     nonce: "0x0",
    //   }
    // );

    // console.log(transaction_hash, transaction_hash.toString(16))
    // const receipt = await hre.starknet.getTransactionReceipt(`0x${transaction_hash.toString(16)}`);
    // console.log(receipt)
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
      await hre.starknet.devnet.requestHandler(
        "/postman/send_message_to_l2",
        "POST",
        {
          l2_contract_address: bridge.address,
          entry_point_selector: selector,
          l1_contract_address: l1Bridge,
          payload: [
            recipient.address,
            `0x${amount.toString(16)}`,
            "0x0",
            "0x0",
          ],
          nonce: "0x0",
        }
      );

      const balanceAfter: bigint = await dai.balanceOf(recipient.address);

      expect(balanceBefore + amount).toEqual(balanceAfter);

      dai.connect(recipient);
      await dai.increaseAllowance(bridge.address, balanceAfter);

      bridge.connect(recipient);

      const { status } = await bridge.initiate_withdraw(1n, balanceAfter);
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
