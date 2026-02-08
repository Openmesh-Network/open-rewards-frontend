"use client"

import { useEffect, useState } from "react"
import { Input } from "../ui/input"
import { Button } from "../ui/button";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";

export function ReadonlyAddress() {
    const [address, setAddress] = useState<string>("");
    const searchParams = useSearchParams();
    const pathname = usePathname();

    useEffect(() => {
        const address = searchParams.get("address");
        if (address) {
            setAddress(address);
        }
    }, [searchParams, setAddress])

    return <div className="flex gap-2">
        <Input className="max-w-[500px]" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="0x..." />
        <Button asChild><Link href={`${pathname}?address=${address}`}>View</Link></Button>
        </div>
}