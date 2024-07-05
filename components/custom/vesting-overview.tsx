"use client"

import { ObjectFilter } from "@/vesting-indexer/api/filter"
import { FilterEventsReturn } from "@/vesting-indexer/api/return-types"
import { replacer, reviver } from "@/vesting-indexer/utils/json"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { useAccount } from "wagmi"

import { Vesting } from "./vesting"

export function VestingOverview() {
  const { address } = useAccount()
  const { data: vestings } = useQuery({
    initialData: [],
    queryKey: ["vestings", address],
    queryFn: async () => {
      if (!address) {
        return []
      }

      const filter: ObjectFilter = {
        type: { equal: "BeneficiaryCreated" },
        beneficiary: {
          equal: address.toLowerCase(),
          convertValueToLowercase: true,
        },
      }
      const response = await axios.post(
        "/vesting-indexer/filterEvents/",
        JSON.parse(JSON.stringify(filter, replacer))
      )
      if (response.status !== 200) {
        throw new Error(`Fetching vesting events error: ${response.data}`)
      }
      const events = JSON.parse(
        JSON.stringify(response.data),
        reviver
      ) as FilterEventsReturn
      return events.map((event) => event.address)
    },
  })

  if (!address) {
    return <span>Connect your wallet to see your vesting rewards.</span>
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {vestings.map((contract, i) => (
        <Vesting key={i} contract={contract} />
      ))}
    </div>
  )
}
