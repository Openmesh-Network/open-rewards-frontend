export interface ApiClaim {
    claim: {
        amount: number,
        ticker?: string,
        unlockedPercent: number,
        claimedPercent: number,
        unlockedDate: Date,
    },
    contact: {
        email: string,
    },
    proof: {
        address: string,
        signature: string,
        message: string,
    },
}

export async function POST(request: Request) {
  const body: ApiClaim = await request.json();

  if (process.env.DISCORD_WEBHOOK_URL) {
    await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: JSON.stringify(body) }),
    });
  }

  return new Response(null, { status: 200 })
}