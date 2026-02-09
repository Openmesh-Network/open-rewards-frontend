"use client"

import { ObjectFilter } from "@/vesting-indexer/api/filter"
import { FilterEventsReturn } from "@/vesting-indexer/api/return-types"
import { replacer, reviver } from "@/vesting-indexer/utils/json"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"

import { ReadOnlyVesting, Vesting } from "./vesting"
import { useAddress } from "@/hooks/useAddress"

export function VestingOverview() {
  const { address } = useAddress()
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
      return events.map((event) => {
        return { contract: event.address, chainId: event.chainId }
      })
    },
  })

  if (!address) {
    return <span>Connect your wallet to see your vesting rewards.</span>
  }

  if (address === "0xD9779905870Df69FE6E8F149eC33afD44113e87A") {
    return (
<div className="flex flex-col gap-4">
  <span className="px-3 rounded-lg py-1 bg-green-600 text-white">Openmesh DAO Voting Member</span>
      <div className="flex flex-wrap gap-2">
        <ReadOnlyVesting amount={4_300_000} unlockedDate={new Date(2023, 3-1, 14)} unlockedPercent={100} claimedPercent={0} />
        <ReadOnlyVesting amount={2_400_000} unlockedDate={new Date(2023, 3-1, 14)} unlockedPercent={100} claimedPercent={0} />
        <ReadOnlyVesting amount={1_000_000} unlockedDate={new Date(2024, 2-1, 9)} unlockedPercent={100} claimedPercent={0} />
        <ReadOnlyVesting amount={3_140_000} unlockedDate={new Date(2024, 6-1, 18)} unlockedPercent={100} claimedPercent={0} />
        <ReadOnlyVesting amount={7_120_000} unlockedDate={new Date(2024, 7-1, 27)} unlockedPercent={100} claimedPercent={0} />
      </div>
</div>
    );
  }

  if (address === "0xa9BE414c38F1612DeADf39e4666fd741F5199D6C") {
    return (
      <div className="flex flex-wrap gap-2">
        <ReadOnlyVesting amount={5_800_000} unlockedDate={new Date(2023, 3-1, 14)} unlockedPercent={100} claimedPercent={0} />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {vestings.map((vesting, i) => (
        <Vesting key={i} {...vesting} />
      ))}
    </div>
  )
}
