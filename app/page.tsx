import { siteConfig } from "@/config/site"
import { VestingClaims } from "@/components/custom/vesting-claims"
import { VestingOverview } from "@/components/custom/vesting-overview"
import { ReadonlyAddress } from "@/components/custom/readonly-address"
import { Suspense } from "react"

export default function IndexPage() {
  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
      <div className="flex max-w-[980px] flex-col items-start gap-2">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
          {siteConfig.name}
        </h1>
        <p className="max-w-[700px] text-lg text-muted-foreground">
          {siteConfig.description}
        </p>
      </div>
      <span className="text-lg font-semibold">Vesting Rewards</span>
      <Suspense><VestingOverview /></Suspense>
      <span className="text-lg font-semibold">Claim History</span>
      <Suspense><VestingClaims /></Suspense>
      <div className="flex flex-col gap-2">
        <span className="text-lg font-semibold">View Wallet</span>
        <span className="text-sm text-muted-foreground">Readonly access to preview allocations granted to a wallet.</span>
      </div>
      <Suspense><ReadonlyAddress /></Suspense>
    </section>
  )
}
