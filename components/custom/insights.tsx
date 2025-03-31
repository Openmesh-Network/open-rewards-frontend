"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ObjectFilter } from "@/vesting-indexer/api/filter"
import { FilterEventsReturn } from "@/vesting-indexer/api/return-types"
import { replacer, reviver } from "@/vesting-indexer/utils/json"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { Address, formatUnits } from "viem"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card"
import { Label } from "../ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { chains } from "./web3-provider"

interface InsightData {
  vesting?: {
    amount: bigint
    start: number
    duration: number
  }
  beneficiary?: Address
  cliff?: number
  manager?: string
  stop?: number
}

export function Insights() {
  const { data: vestingEvents } = useQuery({
    queryKey: ["vesting-insight"],
    queryFn: async () => {
      const filter: ObjectFilter = {
        type: {
          oneOf: [
            { equal: "BeneficiaryCreated" },
            { equal: "LinearVestingCreated" },
            { equal: "CliffCreated" },
            { equal: "ManagerCreated" },
            { equal: "StopAt" },
          ],
        },
        chainId: {
          equal: 1,
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
      return events
    },
  })

  const vestings = useMemo(() => {
    if (!vestingEvents) {
      return undefined
    }

    return vestingEvents.reduce(
      (prev, cur) => {
        let vestingChanges: InsightData = {}

        if (cur.type === "BeneficiaryCreated") {
          vestingChanges.beneficiary = cur.beneficiary
        }

        if (cur.type === "LinearVestingCreated") {
          vestingChanges.vesting = {
            amount: cur.amount,
            start: Number(cur.start),
            duration: Number(cur.duration),
          }
        }

        if (cur.type === "CliffCreated") {
          vestingChanges.cliff = Number(cur.cliff)
        }

        if (cur.type === "ManagerCreated") {
          vestingChanges.manager = cur.manager
        }

        if (cur.type === "StopAt") {
          vestingChanges.stop = Number(cur.stop)
        }

        prev[`${cur.chainId}::${cur.address}`] = {
          ...prev[`${cur.chainId}::${cur.address}`],
          ...vestingChanges,
        }

        return prev
      },
      {} as { [vestingId: string]: InsightData }
    )
  }, [vestingEvents])

  const [vestingType, setVestingType] = useState<"managed" | "unmanaged">(
    "managed"
  )

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 place-items-center">
        <Label htmlFor="vestingType">Vesting Type</Label>
        <Select
          value={vestingType}
          onValueChange={(t) => setVestingType(t as any)}
        >
          <SelectTrigger id="vestingType" className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="managed">Managed</SelectItem>
            <SelectItem value="unmanaged">Unmanaged</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 max-xl:grid-cols-1 gap-2">
        {vestings &&
          Object.keys(vestings)
            .filter((vestingId) =>
              vestingType === "managed"
                ? !!vestings[vestingId].manager
                : !vestings[vestingId].manager
            )
            .sort((vestingId1, vestingId2) => {
              const vesting1 = vestings[vestingId1]
              const vesting2 = vestings[vestingId2]

              if (!vesting1.vesting && !vesting2.vesting) {
                return 0
              }

              if (!vesting2.vesting) {
                return -1
              }

              if (!vesting1.vesting) {
                return 1
              }

              return vesting1.vesting.start - vesting2.vesting.start
            })
            .map((vestingId, i) => {
              const idSplit = vestingId.split("::")
              const chainId = parseInt(idSplit[0])
              const address = idSplit[1]
              const vesting = vestings[vestingId]

              return (
                <VestingInsight
                  key={i}
                  chainId={chainId}
                  address={address}
                  vesting={vesting}
                />
              )
            })}
      </div>
    </div>
  )
}

function VestingInsight({
  chainId,
  address,
  vesting,
}: {
  chainId: number
  address: string
  vesting: InsightData
}) {
  const chain = chains.find((c) => c.id === chainId)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Link
            href={`${chain?.blockExplorers.default?.url ?? "https://etherscan.io"}/address/${address}`}
            target="_blank"
          >
            {address}
          </Link>
        </CardTitle>
        <CardDescription>{chain?.name ?? chainId.toString()}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {vesting.beneficiary && (
            <Link
              href={`${chain?.blockExplorers.default?.url ?? "https://etherscan.io"}/address/${vesting.beneficiary}`}
              target="_blank"
            >
              For: {vesting.beneficiary}
            </Link>
          )}
          {vesting.vesting && (
            <>
              <span>
                Total:{" "}
                {parseFloat(
                  formatUnits(vesting.vesting.amount, 18)
                ).toLocaleString()}{" "}
                OPEN
              </span>
              <span>
                Start: {new Date(vesting.vesting.start * 1000).toDateString()}
              </span>
              <span>
                Duration:{" "}
                {vesting.vesting.duration / (60 * 60 * 24 * (365 / 12))} months
              </span>
            </>
          )}
          {vesting.cliff && (
            <span>Cliff: {new Date(vesting.cliff * 1000).toDateString()}</span>
          )}
          {vesting.stop && (
            <span>
              Stopped at: {new Date(vesting.stop * 1000).toDateString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
