/**
 * Stub implementation for fedimint-ts
 * This replaces the private @fedibtc/fedimint-ts package
 */

export class FedimintClientBuilder {
  private baseUrl: string = ''
  private password: string = ''
  private federationId: string = ''

  setBaseUrl(url: string | undefined): this {
    this.baseUrl = url || ''
    return this
  }

  setPassword(password: string | undefined): this {
    this.password = password || ''
    return this
  }

  setActiveFederationId(federationId: string): this {
    this.federationId = federationId
    return this
  }

  build(): FedimintClient {
    return new FedimintClient(this.baseUrl, this.password, this.federationId)
  }
}

export class FedimintClient {
  constructor(
    private baseUrl: string,
    private password: string,
    private federationId: string
  ) {}

  async useDefaultGateway(): Promise<void> {
    // Stub implementation
    console.log('[FedimintStub] Using default gateway')
  }

  async federationIds(): Promise<{ federationIds: string[] }> {
    // Stub implementation - return the configured federation ID
    return {
      federationIds: [this.federationId]
    }
  }

  // Additional stub methods as needed
  async balance(): Promise<{ totalMsat: number }> {
    return { totalMsat: 0 }
  }

  async payInvoice(invoice: string): Promise<{ feeMsat: number; preimage: string }> {
    return { feeMsat: 0, preimage: 'stub_preimage' }
  }

  async createInvoice(amountMsat: number, description?: string): Promise<{ invoice: string }> {
    return { invoice: 'lnbc_stub_invoice' }
  }
}
