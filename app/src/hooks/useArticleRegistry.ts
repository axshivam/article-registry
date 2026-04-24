import { useCallback, useEffect, useState } from 'react'
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react'
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import type { PublicKey } from '@solana/web3.js'
import { useToast } from '../context/ToastContext'
import { getExplorerUrl } from '../config'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — JSON import, types derived at call sites
import IDL from '../idl/article_registry.json'

export interface Article {
  publicKey: PublicKey
  account: {
    owner: PublicKey
    title: string
    description: string
    content: string
    references: string[]
    publishedDate: number
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyProgram = Program<any>

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    // Anchor errors embed the program message after "Error Message: "
    const raw = (err as { message: string }).message
    const match = raw.match(/Error Message: (.+)/)
    if (match) return match[1]
    return raw.split('\n')[0]
  }
  return 'Unknown error'
}

export function useArticleRegistry() {
  const { connection } = useConnection()
  const wallet = useAnchorWallet()
  const { addToast } = useToast()

  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)
  const [txPending, setTxPending] = useState(false)

  const getProgram = useCallback((): AnyProgram | null => {
    if (!wallet) return null
    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
      preflightCommitment: 'confirmed',
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Program(IDL as any, provider)
  }, [connection, wallet])

  const fetchArticles = useCallback(async () => {
    const program = getProgram()
    if (!program || !wallet) return
    setLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const accounts = await (program.account as any).articleEntry.all([
        {
          memcmp: {
            // Offset 8 skips the 8-byte account discriminator;
            // the owner Pubkey (32 bytes) is stored immediately after.
            offset: 8,
            bytes: wallet.publicKey.toBase58(),
          },
        },
      ])
      setArticles(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        accounts.map((a: any) => ({
          publicKey: a.publicKey,
          account: a.account as Article['account'],
        })),
      )
    } catch (err) {
      console.error('fetchArticles error:', err)
      addToast('Failed to load articles', 'error')
    } finally {
      setLoading(false)
    }
  }, [getProgram, wallet, addToast])

  const createArticle = useCallback(
    async (title: string, description: string, content: string, references: string[]) => {
      const program = getProgram()
      if (!program) return
      setTxPending(true)
      try {
        const tx = await program.methods
          .createArticleEntry(title, description, content, references)
          .rpc()
        addToast(`Article published! Tx: ${tx.slice(0, 8)}…`, 'success', getExplorerUrl('tx', tx))
        await fetchArticles()
      } catch (err) {
        console.error('createArticle error:', err)
        addToast(extractErrorMessage(err), 'error')
        throw err
      } finally {
        setTxPending(false)
      }
    },
    [getProgram, fetchArticles, addToast],
  )

  const updateArticle = useCallback(
    async (title: string, description: string, content: string, references: string[]) => {
      const program = getProgram()
      if (!program) return
      setTxPending(true)
      try {
        const tx = await program.methods
          .updateArticleEntry(title, description, content, references)
          .rpc()
        addToast(`Article updated! Tx: ${tx.slice(0, 8)}…`, 'success', getExplorerUrl('tx', tx))
        await fetchArticles()
      } catch (err) {
        console.error('updateArticle error:', err)
        addToast(extractErrorMessage(err), 'error')
        throw err
      } finally {
        setTxPending(false)
      }
    },
    [getProgram, fetchArticles, addToast],
  )

  const deleteArticle = useCallback(
    async (title: string) => {
      const program = getProgram()
      if (!program) return
      setTxPending(true)
      try {
        const tx = await program.methods
          .deleteArticleEntry(title)
          .rpc()
        addToast(`Article deleted! Tx: ${tx.slice(0, 8)}…`, 'success', getExplorerUrl('tx', tx))
        await fetchArticles()
      } catch (err) {
        console.error('deleteArticle error:', err)
        addToast(extractErrorMessage(err), 'error')
        throw err
      } finally {
        setTxPending(false)
      }
    },
    [getProgram, fetchArticles, addToast],
  )

  // Re-fetch whenever the connected wallet changes
  useEffect(() => {
    if (wallet?.publicKey) {
      fetchArticles()
    } else {
      setArticles([])
    }
    // wallet.publicKey.toBase58() as primitive dep prevents stale closure
    // without triggering infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet?.publicKey?.toBase58()])

  return { articles, loading, txPending, createArticle, updateArticle, deleteArticle, fetchArticles }
}
