"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createWeb3Modal } from "@web3modal/wagmi/react"
import { defaultWagmiConfig } from "@web3modal/wagmi/react/config"
import { cookieStorage, createStorage, http, WagmiProvider } from "wagmi"
import { mainnet, sepolia } from "wagmi/chains"

import { siteConfig } from "@/config/site"

export const chains = [mainnet, sepolia] as const
export const defaultChain = mainnet

const appName = siteConfig.name
const appDescription = siteConfig.description
const appIcon = "https://claim.openmesh.network/icon.svg" as const
const appUrl = "https://claim.openmesh.network" as const
const metadata = {
  name: appName,
  description: appDescription,
  url: appUrl,
  icons: [appIcon],
}

const projectId = "fdf342182428ad1dac1536fb69c15db8" as const // WalletConnect
const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: {
    [mainnet.id]: http("https://eth.llamarpc.com"),
    [sepolia.id]: http("https://rpc.sepolia.org"),
  },
  auth: { email: false },
})

// Create modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  themeMode: "light",
})

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient()

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
