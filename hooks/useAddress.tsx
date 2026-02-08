import { useSearchParams } from "next/navigation";
import {useAccount} from "wagmi"

export function useAddress() {
    const { address: connectedAddress } = useAccount();
    const searchParams = useSearchParams();
    const readonlyAddress =searchParams.get("address")

    return { address: readonlyAddress ?? connectedAddress, readonly: !!readonlyAddress };
}