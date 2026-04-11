import { useCallback, useEffect, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { cluster, isTestNet } from '../config'

export type RpcStatus = 'unknown' | 'ok' | 'error'

export function useNetworkStatus() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()

  const [rpcStatus, setRpcStatus] = useState<RpcStatus>('unknown')
  const [balance, setBalance] = useState<number | null>(null)

  // ── Check RPC health ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function check() {
      try {
        await connection.getVersion()
        if (!cancelled) setRpcStatus('ok')
      } catch {
        if (!cancelled) setRpcStatus('error')
      }
    }
    check()
    return () => { cancelled = true }
  }, [connection, cluster])

  // ── Fetch wallet balance ──────────────────────────────────────────────────
  const refreshBalance = useCallback(async () => {
    if (!publicKey) { setBalance(null); return }
    try {
      const lamports = await connection.getBalance(publicKey, 'confirmed')
      setBalance(lamports / LAMPORTS_PER_SOL)
    } catch {
      setBalance(null)
    }
  }, [connection, publicKey])

  useEffect(() => {
    refreshBalance()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey?.toBase58()])

  return {
    rpcStatus,
    balance,
    isTestNet,
    refreshBalance,
  }
}
