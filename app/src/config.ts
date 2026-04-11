import { clusterApiUrl } from '@solana/web3.js'

// ── Raw env values ──────────────────────────────────────────────────────────
type SolanaCluster = 'devnet' | 'testnet' | 'mainnet-beta'
const networkEnv = (import.meta.env.VITE_NETWORK as SolanaCluster) || 'devnet'
const rpcUrlEnv = import.meta.env.VITE_RPC_URL as string | undefined

export type AppCluster = 'devnet' | 'testnet' | 'mainnet-beta'

export const cluster: AppCluster = networkEnv
export const endpoint: string = rpcUrlEnv ?? clusterApiUrl(networkEnv)

/** True when the app is on a non-production cluster (airdrop allowed). */
export const isTestNet = cluster === 'devnet' || cluster === 'testnet'

// ── Human-readable labels & colours per cluster ──────────────────────────────
export const CLUSTER_META: Record<
  AppCluster,
  { label: string; color: string; textColor: string; borderColor: string }
> = {
  devnet: {
    label: 'Devnet',
    color: 'bg-violet-500/15',
    textColor: 'text-violet-300',
    borderColor: 'border-violet-500/30',
  },
  testnet: {
    label: 'Testnet',
    color: 'bg-blue-500/15',
    textColor: 'text-blue-300',
    borderColor: 'border-blue-500/30',
  },
  'mainnet-beta': {
    label: 'Mainnet',
    color: 'bg-emerald-500/15',
    textColor: 'text-emerald-300',
    borderColor: 'border-emerald-500/30',
  },
}

// ── Phantom wallet network config instructions ───────────────────────────────
export const PHANTOM_NETWORK_STEPS: Record<AppCluster, { title: string; steps: string[] }> = {
  devnet: {
    title: 'Connect Phantom to Devnet',
    steps: [
      'Open the Phantom extension and click the ≡ menu (top-right)',
      'Go to Settings → Developer Settings',
      'Enable the "Testnet Mode" toggle',
      'Return to the main screen and click your current network name',
      'Select "Devnet"',
    ],
  },
  testnet: {
    title: 'Connect Phantom to Testnet',
    steps: [
      'Open the Phantom extension and click the ≡ menu (top-right)',
      'Go to Settings → Developer Settings',
      'Enable the "Testnet Mode" toggle',
      'Return to the main screen and click your current network name',
      'Select "Testnet"',
    ],
  },
  'mainnet-beta': {
    title: 'Connect Phantom to Mainnet',
    steps: [
      'Phantom defaults to Mainnet — no extra steps needed',
      'If you changed it, click your network name on the main screen',
      'Select "Mainnet Beta"',
    ],
  },
}

// ── Faucet URLs for test networks ────────────────────────────────────────────
export const FAUCET_URL: Partial<Record<AppCluster, string>> = {
  devnet: 'https://faucet.solana.com',
  testnet: 'https://faucet.solana.com',
}
