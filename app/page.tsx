import { siteConfig } from "@/config/site"
import { VestingClaims } from "@/components/custom/vesting-claims"
import { VestingOverview } from "@/components/custom/vesting-overview"

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
      <VestingOverview />
      <span className="text-lg font-semibold">Claim History</span>
      <VestingClaims />
    </section>
  )
}
