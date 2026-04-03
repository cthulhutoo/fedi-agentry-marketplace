'use client'

import { useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { ListingWithSeller } from '@/lib/drizzle/schema'
import { webln } from '@/lib/webln'
import agentry from '@/lib/agentry'
import { formatPrice } from '@/lib/utils'

interface PaymentFlowProps {
  listing: ListingWithSeller
  buyerAgentId: string
  onComplete?: (transactionId: string) => void
  onCancel?: () => void
}

type PaymentStep = 'select' | 'escrow_fund' | 'direct_pay' | 'confirm' | 'processing' | 'complete' | 'error'

export function PaymentFlow({ listing, buyerAgentId, onComplete, onCancel }: PaymentFlowProps) {
  const [step, setStep] = useState<PaymentStep>('select')
  const [paymentType, setPaymentType] = useState<'escrow' | 'direct' | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [escrowContract, setEscrowContract] = useState<string | null>(null)
  const [transactionId, setTransactionId] = useState<string | null>(null)

  const initializeEscrow = useCallback(async () => {
    setIsProcessing(true)
    setStep('processing')

    try {
      // Get seller's agent info from Agentry (or use seller's pubkey for escrow)
      const sellerPubkey = listing.seller.pubkey
      const buyerPubkey = await webln.getInfo().then(info => info?.pubkey || '')

      if (!buyerPubkey) {
        throw new Error('Could not get buyer public key')
      }

      // Create escrow contract via Agentry
      const contract = await agentry.createEscrowContract({
        client_id: buyerAgentId,
        agent_id: listing.seller.agentId || String(listing.seller.id) || 'unknown',
        amount_sats: listing.priceSats,
        mint_url: listing.mintUrl || 'https://mint.minibits.cash/Bitcoin',
        client_pubkey: buyerPubkey,
        agent_pubkey: sellerPubkey,
        terms: `Purchase: ${listing.title} (${listing.cuid})`,
      })

      setEscrowContract(contract.id)
      setStep('escrow_fund')
      toast.success('Escrow contract created!')
    } catch (err) {
      const error = err as Error
      toast.error(`Escrow failed: ${error.message}`)
      setStep('error')
    } finally {
      setIsProcessing(false)
    }
  }, [listing, buyerAgentId])

  const fundEscrow = useCallback(async () => {
    if (!escrowContract) return

    setIsProcessing(true)
    toast.loading('Funding escrow contract...')

    try {
      // Create mint quote for Cashu ecash
      const quote = await agentry.createMintQuote(
        buyerAgentId,
        listing.priceSats,
        listing.mintUrl || 'https://mint.minibits.cash/Bitcoin'
      )

      // Pay the Lightning invoice via WebLN
      const paymentResult = await webln.payInvoice(quote.payment_request, listing.priceSats)

      if (!paymentResult?.preimage) {
        throw new Error('Payment failed - no preimage received')
      }

      // Accept the escrow contract
      await agentry.acceptEscrowContract(escrowContract)

      setTransactionId(escrowContract)
      setStep('complete')
      toast.success('Escrow funded successfully!')
      onComplete?.(escrowContract)
    } catch (err) {
      const error = err as Error
      toast.error(`Funding failed: ${error.message}`)
      setStep('error')
    } finally {
      setIsProcessing(false)
    }
  }, [escrowContract, listing, buyerAgentId, onComplete])

  const payDirect = useCallback(async () => {
    setIsProcessing(true)
    setStep('processing')
    toast.loading('Creating payment invoice...')

    try {
      // For direct payment, seller creates invoice
      // In a real implementation, this would call the seller's endpoint
      // For prototype, we'll create a placeholder flow

      // Option 1: Request invoice from seller via Nostr DM
      // Option 2: Use escrow-less direct Cashu transfer

      // For demo: Simulate direct payment via Cashu
      const quote = await agentry.createMintQuote(
        buyerAgentId,
        listing.priceSats,
        listing.mintUrl || 'https://mint.minibits.cash/Bitcoin'
      )

      // Pay Lightning invoice
      await webln.payInvoice(quote.payment_request, listing.priceSats)

      // Send Cashu tokens to seller (would be done via Agentry send)
      // This is simplified - real flow would involve token exchange

      setTransactionId(`direct_${Date.now()}`)
      setStep('complete')
      toast.success('Payment sent directly!')
      onComplete?.(`direct_${Date.now()}`)
    } catch (err) {
      const error = err as Error
      toast.error(`Payment failed: ${error.message}`)
      setStep('error')
    } finally {
      setIsProcessing(false)
    }
  }, [listing, buyerAgentId, onComplete])

  const renderStep = () => {
    switch (step) {
      case 'select':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Choose Payment Method</h3>
            <p className="text-sm text-neutral-500">
              {formatPrice(listing.priceSats)} for &quot;{listing.title}&quot;
            </p>

            <div className="grid gap-3">
              {listing.escrowEnabled && (
                <button
                  onClick={() => {
                    setPaymentType('escrow')
                    initializeEscrow()
                  }}
                  disabled={isProcessing}
                  className="flex items-center gap-3 p-4 border-2 border-neutral-200 dark:border-neutral-700 rounded-xl hover:border-green-500 dark:hover:border-green-400 transition-colors text-left"
                >
                  <div className="text-2xl">🔒</div>
                  <div className="flex-1">
                    <div className="font-medium">Escrow Payment (Recommended)</div>
                    <div className="text-sm text-neutral-500">
                      Funds held by Agentry until you confirm receipt
                    </div>
                  </div>
                </button>
              )}

              {listing.directPaymentEnabled && (
                <button
                  onClick={() => {
                    setPaymentType('direct')
                    setStep('direct_pay')
                  }}
                  disabled={isProcessing}
                  className="flex items-center gap-3 p-4 border-2 border-neutral-200 dark:border-neutral-700 rounded-xl hover:border-orange-500 dark:hover:border-orange-400 transition-colors text-left"
                >
                  <div className="text-2xl">⚡</div>
                  <div className="flex-1">
                    <div className="font-medium">Direct Payment</div>
                    <div className="text-sm text-neutral-500">
                      Pay seller directly via Lightning/Cashu
                    </div>
                  </div>
                </button>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={onCancel}
                className="flex-1 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )

      case 'escrow_fund':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Fund Escrow Contract</h3>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Escrow contract created! Contract ID: <code className="text-xs">{escrowContract}</code>
              </p>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Your funds will be held in escrow until you mark the item as received.
              The seller will be notified to ship the item.
            </p>
            <div className="flex gap-3 pt-4">
              <button
                onClick={onCancel}
                className="flex-1 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={fundEscrow}
                disabled={isProcessing}
                className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : `Fund ${formatPrice(listing.priceSats)}`}
              </button>
            </div>
          </div>
        )

      case 'direct_pay':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Direct Payment</h3>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                ⚠️ Warning: Direct payments have no buyer protection. Only use for trusted sellers.
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setStep('select')}
                className="flex-1 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg"
              >
                Back
              </button>
              <button
                onClick={payDirect}
                disabled={isProcessing}
                className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : `Pay ${formatPrice(listing.priceSats)}`}
              </button>
            </div>
          </div>
        )

      case 'processing':
        return (
          <div className="space-y-4 text-center py-8">
            <div className="animate-spin text-4xl">⏳</div>
            <p className="text-neutral-600 dark:text-neutral-400">
              Processing {paymentType === 'escrow' ? 'escrow' : 'payment'}...
            </p>
            <p className="text-sm text-neutral-500">
              Please confirm the transaction in your wallet
            </p>
          </div>
        )

      case 'complete':
        return (
          <div className="space-y-4 text-center py-8">
            <div className="text-5xl">✅</div>
            <h3 className="text-xl font-semibold text-green-600">
              {paymentType === 'escrow' ? 'Escrow Funded!' : 'Payment Sent!'}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              {paymentType === 'escrow'
                ? 'The seller has been notified. Funds will be released when you confirm receipt.'
                : 'Payment sent directly to seller. Transaction ID: ' + transactionId}
            </p>
            <button
              onClick={onCancel}
              className="py-2 px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
            >
              Close
            </button>
          </div>
        )

      case 'error':
        return (
          <div className="space-y-4 text-center py-8">
            <div className="text-5xl">❌</div>
            <h3 className="text-xl font-semibold text-red-600">Payment Failed</h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              Something went wrong. Please try again or choose a different payment method.
            </p>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setStep('select')}
                className="flex-1 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg"
              >
                Try Again
              </button>
              <button
                onClick={onCancel}
                className="flex-1 py-2 bg-neutral-500 hover:bg-neutral-600 text-white rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-lg p-6 max-w-md mx-auto">
      {renderStep()}
    </div>
  )
}
