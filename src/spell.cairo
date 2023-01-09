%lang starknet

from starkware.cairo.common.cairo_builtins import HashBuiltin

@contract_interface
namespace HasWards {
    func deny(user: felt) {
    }
}

@external
func execute{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() {
    const dai = 0x03e85bfbb8e2a42b7bead9e88e9a1b19dbccf661471061807292120462396ec9;
    const bridge = 0x057b7fe4e59d295de5e7955c373023514ede5b972e872e9aa5dcdf563f5cfacb;
    const bridge_legacy = 0x0278f24c3e74cbf7a375ec099df306289beb0605a346277d200b791a7f811a19;
    const teleport_gateway = 0x078e1e7cc88114fe71be7433d1323782b4586c532a1868f072fc44ce9abf6714;
    const gov_relay_legacy = 0x30255465a3d33f430ea6e16cb22cc09b9291972f7f8c7198b5e5b1ef522b85c;

    // deny legacy gov relay
    HasWards.deny(dai, gov_relay_legacy);
    HasWards.deny(bridge, gov_relay_legacy);
    HasWards.deny(bridge_legacy, gov_relay_legacy);
    HasWards.deny(teleport_gateway, gov_relay_legacy);

    // deny legacy bridge
    HasWards.deny(dai, bridge_legacy);

    return ();
}