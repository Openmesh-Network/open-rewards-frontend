"use client"

import Link from "next/link"
import { ObjectFilter } from "@/vesting-indexer/api/filter"
import { FilterEventsReturn } from "@/vesting-indexer/api/return-types"
import { ERC20Released } from "@/vesting-indexer/types/rewards/rewards-events"
import { replacer, reviver } from "@/vesting-indexer/utils/json"
import { useQuery } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import axios from "axios"
import { formatUnits } from "viem"
import { useAccount } from "wagmi"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { chains } from "@/components/custom/web3-provider"

export function VestingClaims() {
  const { address } = useAccount()
  const { data: claims } = useQuery({
    initialData: [],
    queryKey: ["claims", address],
    queryFn: async () => {
      if (!address) {
        return []
      }

      const filter: ObjectFilter = {
        type: { equal: "ERC20Released" },
        beneficiary: {
          equal: address.toLowerCase(),
          convertValueToLowercase: true,
        },
      }
      const response = await axios.post(
        "/vesting-indexer/filterEvents",
        JSON.parse(JSON.stringify(filter, replacer))
      )
      if (response.status !== 200) {
        throw new Error(`Fetching vesting events error: ${response.data}`)
      }
      const events = JSON.parse(
        JSON.stringify(response.data),
        reviver
      ) as FilterEventsReturn
      return events.map((event) => event as ERC20Released).toReversed()
    },
  })

  if (!address) {
    return <span>Connect your wallet to see your vesting claims.</span>
  }

  const columns: ColumnDef<ERC20Released>[] = [
    {
      header: "Date",
      cell: ({ row }) => (
        <span>
          {new Date(Number(row.original.timestamp) * 1000).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: "Time",
      cell: ({ row }) => (
        <span>
          {new Date(Number(row.original.timestamp) * 1000).toLocaleTimeString()}
        </span>
      ),
    },
    {
      header: "Amount",
      cell: ({ row }) => (
        <span>
          {Number(formatUnits(row.original.amount, 18)).toFixed(2).toString()}{" "}
          sOPEN
        </span>
      ),
    },
    {
      header: "Transaction",
      cell: ({ row }) => {
        return (
          <Button asChild>
            <Link
              href={`${chains.find((c) => c.id === row.original.chainId)?.blockExplorers.default.url}/tx/${row.original.transactionHash}`}
              target="_blank"
            >
              View on explorer
            </Link>
          </Button>
        )
      },
    },
  ]

  return (
    <ScrollArea className="w-full whitespace-nowrap rounded-md border">
      <DataTable columns={columns} data={claims} />
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
