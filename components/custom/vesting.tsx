"use client"

import { DCIVestingManagerContract } from "@/contracts/DCIVestingManager"
import { SingleBeneficiaryLinearERC20TransferVestingProxyContract } from "@/contracts/SingleBeneficiaryLinearERC20TransferVestingProxyContract"
import { TokenAllocationVestingManagerContract } from "@/contracts/TokenAllocationVestingManager"
import { useQueryClient } from "@tanstack/react-query"
import { Clock } from "lucide-react"
import { Address, formatUnits } from "viem"
import { useReadContracts } from "wagmi"

import { usePerformTransaction } from "@/hooks/usePerformTransaction"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

const vestingManagers = [
  // {
  //   name: "Token Allocation",
  //   contract: TokenAllocationVestingManagerContract,
  //   release: async (
  //     vestingContract: Address,
  //     vestingInfo: [bigint, bigint, bigint, `0x${string}`]
  //   ) => {
  //     return {
  //       abi: TokenAllocationVestingManagerContract.abi,
  //       address: TokenAllocationVestingManagerContract.address,
  //       functionName: "release",
  //       args: vestingInfo,
  //     }
  //   },
  // },
  {
    name: "DCI Sponsor",
    contract: DCIVestingManagerContract,
    release: async (
      vestingContract: Address,
      vestingInfo: [bigint, bigint, bigint, `0x${string}`]
    ) => {
      return {
        abi: SingleBeneficiaryLinearERC20TransferVestingProxyContract.abi,
        address: vestingContract,
        functionName: "release",
      }
    },
  },
]

export function Vesting({
  contract,
  chainId,
}: {
  contract: Address
  chainId: number
}) {
  const { performTransaction, performingTransaction } = usePerformTransaction({
    chainId: chainId,
  })
  const queryClient = useQueryClient()

  const { data: vestingInfo } = useReadContracts({
    contracts: [
      {
        abi: SingleBeneficiaryLinearERC20TransferVestingProxyContract.abi,
        address: contract,
        functionName: "amount",
        chainId: chainId,
      },
      {
        abi: SingleBeneficiaryLinearERC20TransferVestingProxyContract.abi,
        address: contract,
        functionName: "start",
        chainId: chainId,
      },
      {
        abi: SingleBeneficiaryLinearERC20TransferVestingProxyContract.abi,
        address: contract,
        functionName: "duration",
        chainId: chainId,
      },
      {
        abi: SingleBeneficiaryLinearERC20TransferVestingProxyContract.abi,
        address: contract,
        functionName: "beneficiary",
        chainId: chainId,
      },
    ],
    allowFailure: false,
    query: {
      staleTime: Infinity,
    },
  })

  const { data: vestingManagerAddresses } = useReadContracts({
    contracts: vestingManagers.map((manager) => {
      return {
        functionName: "getAddress",
        args: vestingInfo,
        ...manager.contract,
        chainId: chainId,
      }
    }),
    allowFailure: false,
    query: {
      staleTime: Infinity,
      enabled: !!vestingInfo,
    },
  })

  const { data: releaseInfo, refetch: releaseRefetch } = useReadContracts({
    contracts: [
      {
        abi: SingleBeneficiaryLinearERC20TransferVestingProxyContract.abi,
        address: contract,
        functionName: "released",
        chainId: chainId,
      },
      {
        abi: SingleBeneficiaryLinearERC20TransferVestingProxyContract.abi,
        address: contract,
        functionName: "releasable",
        chainId: chainId,
      },
    ],
    allowFailure: false,
  })

  const vestingManagerIndex = vestingManagerAddresses?.findIndex(
    (vestingManagerAddress) =>
      vestingManagerAddress?.toLowerCase() === contract.toLowerCase()
  )
  if (vestingManagerIndex === undefined || vestingManagerIndex === -1) {
    return <></>
  }
  const vestingManager = vestingManagers[vestingManagerIndex]
  const currentDate = new Date().getTime() / 1000
  const vestedPercent = vestingInfo
    ? (100 * (currentDate - Number(vestingInfo[1]))) / Number(vestingInfo[2])
    : undefined
  const claimedPercent =
    vestingInfo && releaseInfo
      ? (100 * Number(formatUnits(releaseInfo[0], 18))) /
        Number(formatUnits(vestingInfo[0], 18))
      : undefined

  return (
    <Card className="flex max-w-xs grow flex-col gap-y-1 p-2">
      <CardHeader className="gap-y-1">
        <CardTitle>{vestingManager.name}</CardTitle>
        <p className="w-full rounded-lg border bg-secondary px-3 py-1.5 text-center text-lg shadow-inner">
          {releaseInfo
            ? Number(formatUnits(releaseInfo?.[1], 18)).toFixed(2).toString()
            : "..."}{" "}
          sOPEN
        </p>
        <CardDescription className="flex flex-col gap-y-2">
          {vestedPercent !== undefined && (
            <div>
              <Label>Vested ({vestedPercent.toFixed(2)}%)</Label>
              <Progress value={vestedPercent} max={100} />
            </div>
          )}
          {claimedPercent !== undefined && (
            <div>
              <Label>Claimed ({claimedPercent.toFixed(2)}%)</Label>
              <Progress value={claimedPercent} max={100} />
            </div>
          )}
          <div className="flex place-items-center gap-x-2 pt-1">
            <Clock />
            {vestingInfo && currentDate < vestingInfo[1] && (
              <Label>
                Starts in{" "}
                {Math.round(
                  (Number(vestingInfo[1]) - currentDate) / (24 * 60 * 60)
                )}{" "}
                days
              </Label>
            )}
            {vestingInfo &&
              currentDate >= vestingInfo[1] &&
              currentDate < vestingInfo[1] + vestingInfo[2] && (
                <Label>
                  {Math.round(
                    (Number(vestingInfo[1] + vestingInfo[2]) - currentDate) /
                      (24 * 60 * 60)
                  )}{" "}
                  days remaining
                </Label>
              )}
            {vestingInfo && currentDate >= vestingInfo[1] + vestingInfo[2] && (
              <Label>Ended</Label>
            )}
          </div>
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button
          className="w-full"
          onClick={() => {
            performTransaction({
              transaction: async () => {
                if (!vestingInfo) {
                  return undefined
                }

                return vestingManager.release(contract, vestingInfo) as any
              },
              onConfirmed: (receipt) => {
                releaseRefetch()
                queryClient.invalidateQueries({ queryKey: ["claims"] })
              },
            })
          }}
          disabled={
            !vestingInfo ||
            performingTransaction ||
            releaseInfo?.[1] === BigInt(0)
          }
        >
          Claim
        </Button>
      </CardFooter>
    </Card>
  )
}
