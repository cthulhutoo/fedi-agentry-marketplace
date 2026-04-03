/**
 * WebLN Abstraction Layer for Fedi Mod
 * Wraps window.webln with error handling, type safety, and UX feedback
 */

import { toast } from 'react-hot-toast'

// WebLN Types
declare global {
  interface Window {
    webln?: WebLNProvider
    nostr?: NostrProvider
  }
}

export interface WebLNProvider {
  enable(): Promise<void>
  getInfo(): Promise<WebLNInfo>
  makeInvoice(params: MakeInvoiceParams): Promise<MakeInvoiceResult>
  sendPayment(paymentRequest: string): Promise<SendPaymentResult>
  keysend?(params: KeysendParams): Promise<SendPaymentResult>
  signMessage?(message: string): Promise<SignMessageResult>
  verifyMessage?(signature: string, message: string): Promise<void>
}

export interface WebLNInfo {
  node?: {
    alias?: string
    pubkey?: string
    color?: string
  }
  alias?: string
  pubkey?: string
  color?: string
  supports?: string[]
}

export interface MakeInvoiceParams {
  amount?: number
  defaultMemo?: string
  minimumAmount?: number
  maximumAmount?: number
}

export interface MakeInvoiceResult {
  paymentRequest: string
  rHash?: string
  paymentHash?: string
}

export interface SendPaymentResult {
  preimage: string
  paymentHash?: string
  route?: unknown
}

export interface KeysendParams {
  destination: string
  amount: number
  customRecord?: Record<string, string>
}

export interface SignMessageResult {
  message: string
  signature: string
}

// Nostr Provider Types
export interface NostrProvider {
  getPublicKey(): Promise<string>
  signEvent(event: NostrEvent): Promise<NostrEvent>
  nip04?: {
    encrypt(pubkey: string, plaintext: string): Promise<string>
    decrypt(pubkey: string, ciphertext: string): Promise<string>
  }
}

export interface NostrEvent {
  id?: string
  kind: number
  pubkey?: string
  created_at: number
  content: string
  tags: string[][]
  sig?: string
}

// Provider Detection
export function isWebLNAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.webln
}

export function isNostrAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.nostr
}

export function getEnvironment(): 'fedi' | 'browser' | 'unknown' {
  if (typeof window === 'undefined') return 'unknown'
  if (window.webln && window.nostr) return 'fedi'
  return 'browser'
}

// WebLN Wrapper
class WebLNClient {
  private webln: WebLNProvider | null = null
  private enabled = false

  async initialize(): Promise<boolean> {
    if (!isWebLNAvailable()) {
      console.warn('WebLN not available - not running in Fedi or WebLN-compatible wallet')
      return false
    }

    try {
      this.webln = window.webln!
      await this.webln.enable()
      this.enabled = true
      console.log('WebLN enabled successfully')
      return true
    } catch (err) {
      const error = err as Error
      console.error('WebLN initialization failed:', error.message)
      toast.error(`Wallet access denied: ${error.message}`)
      return false
    }
  }

  async getInfo(): Promise<WebLNInfo | null> {
    if (!this.webln || !this.enabled) {
      if (!await this.initialize()) return null
    }

    try {
      return await this.webln!.getInfo()
    } catch (err) {
      const error = err as Error
      console.error('Failed to get wallet info:', error.message)
      return null
    }
  }

  async createInvoice(amountSats: number, memo: string): Promise<MakeInvoiceResult | null> {
    if (!this.webln || !this.enabled) {
      if (!await this.initialize()) {
        toast.error('Please connect your Lightning wallet')
        return null
      }
    }

    const toastId = toast.loading('Creating Lightning invoice...')

    try {
      const result = await this.webln!.makeInvoice({
        amount: amountSats,
        defaultMemo: memo,
      })

      toast.success('Invoice created!', { id: toastId })
      return result
    } catch (err) {
      const error = err as Error
      console.error('Invoice creation failed:', error.message)
      toast.error(`Failed to create invoice: ${error.message}`, { id: toastId })
      return null
    }
  }

  async payInvoice(paymentRequest: string, amountSats?: number): Promise<SendPaymentResult | null> {
    if (!this.webln || !this.enabled) {
      if (!await this.initialize()) {
        toast.error('Please connect your Lightning wallet')
        return null
      }
    }

    const toastId = toast.loading(`Paying ${amountSats ? `${amountSats} sats` : 'invoice'}...`)

    try {
      const result = await this.webln!.sendPayment(paymentRequest)
      
      toast.success('Payment sent!', { id: toastId })
      return result
    } catch (err) {
      const error = err as Error
      console.error('Payment failed:', error.message)
      
      let errorMsg = error.message
      if (error.message.includes('cancelled')) {
        errorMsg = 'Payment cancelled by user'
      } else if (error.message.includes('insufficient')) {
        errorMsg = 'Insufficient balance'
      } else if (error.message.includes('route')) {
        errorMsg = 'No payment route found'
      }
      
      toast.error(errorMsg, { id: toastId })
      return null
    }
  }

  // Bridge: Lightning Payment → Cashu Ecash
  async payToEcashBridge(
    lightningInvoice: string,
    amountSats: number,
    onSuccess?: (preimage: string) => void
  ): Promise<string | null> {
    const result = await this.payInvoice(lightningInvoice, amountSats)
    
    if (result?.preimage) {
      onSuccess?.(result.preimage)
      return result.preimage
    }
    
    return null
  }

  isEnabled(): boolean {
    return this.enabled
  }
}

// Nostr Wrapper
class NostrClient {
  private nostr: NostrProvider | null = null
  publicKey: string | null = null

  async connect(): Promise<boolean> {
    if (!isNostrAvailable()) {
      console.warn('Nostr not available')
      return false
    }

    try {
      this.nostr = window.nostr!
      this.publicKey = await this.nostr.getPublicKey()
      console.log('Nostr connected, pubkey:', this.publicKey)
      return true
    } catch (err) {
      const error = err as Error
      console.error('Nostr connection failed:', error.message)
      toast.error(`Nostr access denied: ${error.message}`)
      return false
    }
  }

  async signEvent(event: Omit<NostrEvent, 'pubkey'>): Promise<NostrEvent | null> {
    if (!this.nostr) {
      if (!await this.connect()) return null
    }

    try {
      const fullEvent = {
        ...event,
        pubkey: this.publicKey!,
      } as NostrEvent

      return await this.nostr!.signEvent(fullEvent)
    } catch (err) {
      const error = err as Error
      console.error('Event signing failed:', error.message)
      toast.error(`Failed to sign event: ${error.message}`)
      return null
    }
  }

  async encryptDM(recipientPubkey: string, plaintext: string): Promise<string | null> {
    if (!this.nostr?.nip04) {
      toast.error('Nostr encryption not available')
      return null
    }

    try {
      return await this.nostr.nip04.encrypt(recipientPubkey, plaintext)
    } catch (err) {
      const error = err as Error
      console.error('Encryption failed:', error.message)
      return null
    }
  }

  async decryptDM(senderPubkey: string, ciphertext: string): Promise<string | null> {
    if (!this.nostr?.nip04) {
      toast.error('Nostr decryption not available')
      return null
    }

    try {
      return await this.nostr.nip04.decrypt(senderPubkey, ciphertext)
    } catch (err) {
      const error = err as Error
      console.error('Decryption failed:', error.message)
      return null
    }
  }

  async sendNip04Message(
    recipientPubkey: string,
    content: string,
    tags: string[][] = []
  ): Promise<NostrEvent | null> {
    const encrypted = await this.encryptDM(recipientPubkey, content)
    if (!encrypted) return null

    const event: Omit<NostrEvent, 'pubkey'> = {
      kind: 4, // NIP-04 DM
      content: encrypted,
      tags: [['p', recipientPubkey], ...tags],
      created_at: Math.floor(Date.now() / 1000),
    }

    return this.signEvent(event)
  }

  async publishToRelay(
    relayUrl: string,
    event: NostrEvent
  ): Promise<boolean> {
    // WebSocket connection to relay would be established here
    // For now, we'll just log the intent
    console.log('Would publish to relay:', relayUrl, event)
    return true
  }

  getPubkey(): string | null {
    return this.publicKey
  }

  isConnected(): boolean {
    return !!this.nostr && !!this.publicKey
  }
}

// Export singleton instances
export const webln = new WebLNClient()
export const nostr = new NostrClient()

// Combined hook for UI state
export interface WalletState {
  weblnEnabled: boolean
  nostrConnected: boolean
  pubkey: string | null
  walletAlias: string | null
  environment: 'fedi' | 'browser' | 'unknown'
}

export async function getWalletState(): Promise<WalletState> {
  const env = getEnvironment()
  
  if (!webln.isEnabled()) {
    await webln.initialize()
  }
  
  if (!nostr.isConnected()) {
    await nostr.connect()
  }

  const info = webln.isEnabled() ? await webln.getInfo() : null

  return {
    weblnEnabled: webln.isEnabled(),
    nostrConnected: nostr.isConnected(),
    pubkey: nostr.getPubkey(),
    walletAlias: info?.alias || info?.node?.alias || null,
    environment: env,
  }
}

export default { webln, nostr, getWalletState, isWebLNAvailable, isNostrAvailable }
