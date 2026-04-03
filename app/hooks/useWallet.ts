'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  webln, 
  nostr, 
  getWalletState, 
  WalletState,
  isWebLNAvailable,
  isNostrAvailable 
} from '@/lib/webln'

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    weblnEnabled: false,
    nostrConnected: false,
    pubkey: null,
    walletAlias: null,
    environment: 'unknown',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const initialize = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const walletState = await getWalletState()
      setState(walletState)
    } catch (err) {
      setError('Failed to initialize wallet')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    initialize()
  }, [initialize])

  const createInvoice = useCallback(async (amount: number, memo: string) => {
    return await webln.createInvoice(amount, memo)
  }, [])

  const payInvoice = useCallback(async (invoice: string, amount?: number) => {
    return await webln.payInvoice(invoice, amount)
  }, [])

  const sendDM = useCallback(async (recipientPubkey: string, content: string) => {
    return await nostr.sendNip04Message(recipientPubkey, content)
  }, [])

  return {
    ...state,
    isLoading,
    error,
    isAvailable: isWebLNAvailable() && isNostrAvailable(),
    initialize,
    createInvoice,
    payInvoice,
    sendDM,
  }
}
