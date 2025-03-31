import { Insights } from "@/components/custom/insights"

export default function InsightsPage() {
  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
      <span className="text-3xl font-semibold">Insights</span>
      <Insights />
    </section>
  )
}
