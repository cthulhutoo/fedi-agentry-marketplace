/**
 * Agentry API Client
 * Bridges Fedi wallet (Lightning/WebLN) with Agentry ecash/escrow system
 */

import axios, { AxiosInstance } from 'axios'
import { CashuMint, CashuWallet, Proof, Token } from '@cashu/cashu-ts'

const AGENTRY_API_BASE = process.env.NEXT_PUBLIC_AGENTRY_API_URL || 'https://api.agentry.com'

// Types
export interface AgentryAgent {
  id: string
  name: string
  url: string
  description: string
  category: string
  npub: string
  nip05: string
  did: string
  a2a_support: boolean
  mcp_support: boolean
  pricing_model: string
  created_at: string
}

export interface AgentryIdentity {
  agent_id: string
  pubkey: string
  nip05_name: string
  did: string
  valid: boolean
  challenge?: string
}

export interface CashuQuote {
  quote_id: string
  amount: number
  mint_url: string
  payment_request: string // Lightning invoice
  expiry: number
}

export interface EscrowContract {
  id: string
  client_id: string
  agent_id: string
  amount_sats: number
  mint_url: string
  status: 'created' | 'accepted' | 'funded' | 'submitted' | 'approved' | 'disputed'
  client_pubkey: string
  agent_pubkey: string
  terms_hash: string
  created_at: string
  expires_at: string
}

export interface PaymentProfile {
  agent_id: string
  ecash_enabled: boolean
  mint_url: string
  base_price_sats: number
  payment_required: boolean
  wallet_balance: number
}

class AgentryClient {
  private client: AxiosInstance
  private mint: CashuMint | null = null
  private wallet: CashuWallet | null = null

  constructor() {
    this.client = axios.create({
      baseURL: AGENTRY_API_BASE,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })
  }

  // ========== Agent Registration ==========

  async registerAgent(params: {
    name: string
    url: string
    description: string
    category: string
    npub?: string
    contact_email?: string
    a2a_support?: boolean
    mcp_support?: boolean
    pricing_model?: 'free' | 'hybrid' | 'paid'
  }): Promise<AgentryAgent> {
    const response = await this.client.post('/api/agents/register', params)
    return response.data
  }

  async getAgent(agentId: string): Promise<AgentryAgent> {
    const response = await this.client.get(`/api/agents/${agentId}`)
    return response.data
  }

  // ========== Identity / Nostr ==========

  async registerIdentity(params: {
    agent_id: string
    pubkey: string
    nip05_name: string
  }): Promise<AgentryIdentity> {
    const response = await this.client.post('/api/identity/register', params)
    return response.data
  }

  async getChallenge(agentId: string): Promise<{ challenge: string; expires_at: string }> {
    const response = await this.client.post('/api/identity/challenge', { agent_id: agentId })
    return response.data
  }

  async verifyChallenge(
    agentId: string,
    challenge: string,
    signature: string
  ): Promise<{ valid: boolean; did: string }> {
    const response = await this.client.post('/api/identity/verify-challenge', {
      agent_id: agentId,
      challenge,
      signature,
    })
    return response.data
  }

  // ========== Cashu Ecash Payments ==========

  async getPaymentProfile(agentId: string): Promise<PaymentProfile> {
    const response = await this.client.get(`/api/payments/ecash/profile/${agentId}`)
    return response.data
  }

  async updatePaymentProfile(
    agentId: string,
    params: {
      ecash_enabled: boolean
      mint_url: string
      base_price_sats: number
      payment_required: boolean
    }
  ): Promise<PaymentProfile> {
    const response = await this.client.put(`/api/payments/ecash/profile/${agentId}`, params)
    return response.data
  }

  async createMintQuote(
    agentId: string,
    amountSats: number,
    mintUrl: string = 'https://mint.minibits.cash/Bitcoin'
  ): Promise<CashuQuote> {
    const response = await this.client.post('/api/payments/ecash/mint/quote', {
      agent_id: agentId,
      amount_sats: amountSats,
      mint_url: mintUrl,
    })
    return response.data
  }

  async sendEcash(
    agentId: string,
    recipientId: string,
    token: string
  ): Promise<{ success: boolean; tx_id: string }> {
    const response = await this.client.post('/api/payments/ecash/send', {
      from_agent_id: agentId,
      to_agent_id: recipientId,
      token,
    })
    return response.data
  }

  async receiveEcash(
    agentId: string,
    token: string
  ): Promise<{ success: boolean; amount: number }> {
    const response = await this.client.post('/api/payments/ecash/receive', {
      agent_id: agentId,
      token,
    })
    return response.data
  }

  async verifyEcashToken(token: string): Promise<{ valid: boolean; amount: number }> {
    const response = await this.client.post('/api/payments/ecash/verify', { token })
    return response.data
  }

  // ========== Escrow Contracts ==========

  async createEscrowContract(params: {
    client_id: string
    agent_id: string
    amount_sats: number
    mint_url: string
    client_pubkey: string
    agent_pubkey: string
    terms: string
  }): Promise<EscrowContract> {
    const response = await this.client.post('/api/escrow/contracts', params)
    return response.data
  }

  async acceptEscrowContract(contractId: string): Promise<EscrowContract> {
    const response = await this.client.post(`/api/escrow/contracts/${contractId}/accept`)
    return response.data
  }

  async submitEscrowWork(contractId: string, proofOfWork: string): Promise<EscrowContract> {
    const response = await this.client.post(`/api/escrow/contracts/${contractId}/submit`, {
      proof_of_work: proofOfWork,
    })
    return response.data
  }

  async approveEscrowRelease(contractId: string): Promise<EscrowContract> {
    const response = await this.client.post(`/api/escrow/contracts/${contractId}/approve`)
    return response.data
  }

  async disputeEscrow(contractId: string, reason: string): Promise<EscrowContract> {
    const response = await this.client.post(`/api/escrow/contracts/${contractId}/dispute`, {
      reason,
    })
    return response.data
  }

  async getEscrowContract(contractId: string): Promise<EscrowContract> {
    const response = await this.client.get(`/api/escrow/contracts/${contractId}`)
    return response.data
  }

  // ========== Cashu Wallet Operations (Client-side) ==========

  async initializeWallet(mintUrl: string): Promise<void> {
    this.mint = new CashuMint(mintUrl)
    this.wallet = new CashuWallet(this.mint)
  }

  async mintTokens(quoteId: string, blindedMessages: unknown[]): Promise<{ proofs: Proof[] }> {
    if (!this.wallet) throw new Error('Wallet not initialized')
    // Use type assertion to bypass Cashu SDK type issues for prototype
    const wallet = this.wallet as any
    const response = await wallet.mintTokens(blindedMessages.length, quoteId)
    return response
  }

  async sendTokens(amount: number, proofs: Proof[]) {
    if (!this.wallet) throw new Error('Wallet not initialized')
    return this.wallet.send(amount, proofs)
  }

  async receiveTokens(token: string): Promise<Proof[]> {
    if (!this.wallet) throw new Error('Wallet not initialized')
    return this.wallet.receive(token)
  }

  // ========== Bridge: Lightning Invoice → Cashu Ecash ==========

  /**
   * Bridge flow for Fedi mod:
   * 1. User pays Lightning invoice via WebLN
   * 2. Agentry mints Cashu ecash tokens
   * 3. Tokens can be sent to seller or held in escrow
   */
  async bridgeLightningToEcash(
    agentId: string,
    lightningInvoice: string,
    amountSats: number,
    mintUrl: string = 'https://mint.minibits.cash/Bitcoin'
  ): Promise<{ token: string; quote: CashuQuote }> {
    // Create mint quote for equivalent ecash amount
    const quote = await this.createMintQuote(agentId, amountSats, mintUrl)

    // Initialize wallet for receiving
    await this.initializeWallet(mintUrl)

    // Return quote for Lightning payment + token preparation
    return {
      token: quote.quote_id, // Temporary until minted
      quote,
    }
  }
}

export const agentry = new AgentryClient()
export default agentry
