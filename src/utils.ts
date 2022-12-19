import { Contract, number } from "starknet";

export async function isWard(hasWards: Contract, ward: Contract): Promise<boolean> {
    const [w] = await hasWards.wards(ward.address);
    return w.eq(number.toBN(1))
}
