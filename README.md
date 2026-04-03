# 🏪 Fedi-Agentry Marketplace

A community marketplace prototype that bridges **Fedi** (fedi.xyz) with **Agentry.com**, providing Facebook Marketplace-like functionality while leveraging both ecosystems.

## Overview

This is a Fedi mod (mini-app) built on the [ModBoilerplate](https://github.com/fedibtc/ModBoilerplate) template. It enables:

- **P2P Commerce**: Buy and sell goods with Bitcoin/Lightning payments
- **Dual Payment Options**: Direct Cashu ecash or Agentry escrow contracts
- **Nostr Integration**: Encrypted buyer-seller messaging via Nostr DMs (NIP-04)
- **Reputation System**: Transparent ratings and reviews
- **Mobile-First**: Optimized for Fedi's in-app browser

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FEDI APP (Mobile)                             │
│                          (react-native-webview)                          │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────────────┐│
│  │ window.webln │  │ window.nostr │  │    Fedi-Agentry Marketplace     ││
│  │              │  │              │  │      (Next.js Web App)          ││
│  │  Lightning   │  │  Nostr DMs   │  │                                 ││
│  │  Payments    │  │  Identity    │  │  ┌─────────────┐ ┌───────────┐ ││
│  │              │  │  Signing     │  │  │  Listings   │ │  Search   │ ││
│  └──────┬───────┘  └──────┬───────┘  │  │  Buy/Sell   │ │  Filters  │ ││
│         │                 │          │  └──────┬──────┘ └─────┬─────┘ ││
│         └────────┬────────┘          │         │              │       ││
│                  │                   │         └──────┬───────┘       ││
│                  ▼                   │                │              ││
│         ┌────────────────┐          │     ┌──────────▼──────────┐   ││
│         │  Fedi/Fedimint │          │     │   Agentry Bridge    │   ││
│         │  Federation    │          │     │  ┌───────────────┐  │   ││
│         └────────────────┘          │     │  │  Cashu Ecash  │  │   ││
│                                     │     │  ├───────────────┤  │   ││
│                                     │     │  │    Escrow     │  │   ││
│                                     │     │  ├───────────────┤  │   ││
│                                     │     │  │   Identity    │  │   ││
│                                     │     │  └───────────────┘  │   ││
│                                     │     └──────────┬──────────┘   ││
│                                     │                │              ││
│                                     │                ▼              ││
│                                     │       ┌────────────────┐      ││
│                                     │       │  Agentry API   │      ││
│                                     │       │  api.agentry.com       ││
│                                     │       └────────────────┘      ││
│                                     └─────────────────────────────────┘
└─────────────────────────────────────────────────────────────────────────┘
```

## Features

### Gallery

- 📸 **Photo Upload**: Multi-image listing support
- 📝 **Rich Descriptions**: Title, description, condition, location
- 🏷️ **Categories**: Electronics, furniture, vehicles, clothing, more
- 💰 **Sats Pricing**: Bitcoin-native pricing
- 🔍 **Search & Filter**: Category, price, location filtering

### Commerce

| Feature | Description | Status |
|---------|-------------|--------|
| **Direct Payment** | Lightning/Cashu direct to seller | ✅ |
| **Escrow** | Agentry contract-based escrow | ✅ |
| **Messaging** | Nostr encrypted DMs (NIP-04) | ✅ |
| **Reputation** | User ratings and reviews | ✅ |
| **Mobile UX** | Fedi-optimized interface | ✅ |

### Payment Flows

#### Option A: Direct Payment (⚡)
```
Buyer → WebLN → Lightning Invoice → Seller
```

#### Option B: Escrow Contract (🔒)
```
Buyer → Create Escrow → Agentry → Fund Contract → Seller Ships
                                    ↓
                              Buyer Confirms → Funds Released → Seller
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS
- **Package Manager**: Bun
- **Database**: PostgreSQL + Drizzle ORM
- **UI Library**: @fedibtc/ui
- **Notifications**: react-hot-toast

### Key Dependencies

```json
{
  "@cashu/cashu-ts": "^1.0.3",     // Cashu ecash library
  "nostr-tools": "^2.5.1",          // Nostr utilities
  "axios": "^1.6.8",                // API client
  "fedimint-ts": "^0.3.2",          // Fedimint client
  "drizzle-orm": "^0.30.10"         // Database ORM
}
```

## Setup

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- PostgreSQL 14+
- Access to Fedi Alpha app (for testing)

### 1. Clone and Install

```bash
git clone <your-repo>
cd fedi-agentry-marketplace
bun install
```

### 2. Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/fedi_marketplace"

# Agentry (optional for prototype)
NEXT_PUBLIC_AGENTRY_API_URL="https://api.agentry.com"

# Nostr
NEXT_PUBLIC_NOSTR_RELAY="wss://relay.agentry.com"
NEXT_PUBLIC_NOSTR_RELAY_FALLBACK="wss://relay.damus.io"

# Cashu Mint
NEXT_PUBLIC_DEFAULT_MINT_URL="https://mint.minibits.cash/Bitcoin"
```

### 3. Database Setup

```bash
# Create database
createdb fedi_marketplace

# Run migrations
bun db:migrate

# Or use Docker
bun db:sync
```

### 4. Development Server

```bash
# Start dev server
bun run dev

# Or use mprocs (runs multiple processes)
bun run dev  # Starts Next.js
```

The app will be available at `http://localhost:3000`.

### 5. Remote Testing with ngrok

To test in Fedi Alpha:

```bash
# Terminal 1: Start ngrok
npx ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Use this URL in Fedi Alpha app
```

## E2E Testing in Fedi Alpha

### Prerequisites

1. **Download Fedi Alpha**
   - iOS: TestFlight (contact Fedi team for access)
   - Android: APK from Fedi team

2. **Join Test Federation**
   - Get an invite to a Signet testnet federation
   - Or use the public test federation

3. **Enable Developer Mode**
   - Go to Settings → General
   - Tap "General" 10 times quickly
   - Developer Settings will appear

### Testing WebLN Integration

```typescript
// In browser console or app
const testWebLN = async () => {
  if (!window.webln) {
    alert('Not in Fedi - WebLN not available');
    return;
  }
  
  try {
    await window.webln.enable();
    const info = await window.webln.getInfo();
    console.log('Connected:', info);
    
    // Test invoice creation
    const invoice = await window.webln.makeInvoice({
      amount: 1000,
      defaultMemo: 'Test from marketplace'
    });
    console.log('Invoice:', invoice.paymentRequest);
    
  } catch (err) {
    console.error('WebLN Error:', err);
  }
};
```

### Testing Nostr Integration

```typescript
const testNostr = async () => {
  if (!window.nostr) {
    alert('Nostr not available');
    return;
  }
  
  try {
    const pubkey = await window.nostr.getPublicKey();
    console.log('Pubkey:', pubkey);
    
    // Test encryption
    const encrypted = await window.nostr.nip04?.encrypt(
      pubkey, 
      'Hello from marketplace!'
    );
    console.log('Encrypted:', encrypted);
    
  } catch (err) {
    console.error('Nostr Error:', err);
  }
};
```

### Full Marketplace E2E Test

#### Test 1: Create Listing
1. Open marketplace in Fedi Alpha
2. Click "+ Sell Item"
3. Fill form with test data:
   - Title: "Test Headphones"
   - Description: "Barely used"
   - Price: 10000 sats
   - Category: Electronics
   - Enable Escrow: ✓
4. Submit → Verify listing appears

#### Test 2: Browse and Filter
1. View all listings
2. Filter by category (Electronics)
3. Search for "headphones"
4. Verify filtered results

#### Test 3: Buy with Escrow
1. Select a listing
2. Click "Buy"
3. Choose "Escrow Payment"
4. Confirm Lightning invoice payment
5. Verify escrow contract created in Agentry

#### Test 4: Direct Message
1. Click "💬" on any listing
2. Send test message via Nostr DM
3. Verify encrypted message appears

#### Test 5: Reputation
1. Complete a transaction
2. Leave rating/review
3. Verify reputation score updates

## API Integration

### WebLN + Agentry Bridge Example

```typescript
import { webln, nostr } from '@/lib/webln';
import agentry from '@/lib/agentry';

// Complete purchase flow
async function purchaseItem(listing: Listing, buyerAgentId: string) {
  // 1. Initialize wallet
  await webln.initialize();
  const buyerPubkey = await nostr.connect();
  
  // 2. Create escrow contract
  const escrow = await agentry.createEscrowContract({
    client_id: buyerAgentId,
    agent_id: listing.seller.agentId!,
    amount_sats: listing.priceSats,
    mint_url: listing.mintUrl!,
    client_pubkey: buyerPubkey!,
    agent_pubkey: listing.seller.pubkey,
    terms: `Purchase: ${listing.title}`
  });
  
  // 3. Create mint quote
  const quote = await agentry.createMintQuote(
    buyerAgentId,
    listing.priceSats
  );
  
  // 4. Pay Lightning invoice via WebLN
  const payment = await webln.payInvoice(
    quote.payment_request,
    listing.priceSats
  );
  
  // 5. Accept escrow
  await agentry.acceptEscrowContract(escrow.id);
  
  // 6. Send DM to seller
  await nostr.sendNip04Message(
    listing.seller.pubkey,
    `Hi! I just purchased "${listing.title}" via escrow. Contract: ${escrow.id}`
  );
  
  return escrow.id;
}
```

### Nostr DM Example

```typescript
import { nostr } from '@/lib/webln';

async function sendMessage(sellerPubkey: string, message: string) {
  // Encrypt and send
  const event = await nostr.sendNip04Message(sellerPubkey, message);
  
  // Publish to relay
  await nostr.publishToRelay('wss://relay.agentry.com', event!);
  
  console.log('Message sent:', event?.id);
}
```

## Deployment

### Phase 1: External Hosting (Current)

Deploy to any hosting provider:

```bash
# Build
bun run build

# Deploy to Vercel
vercel --prod

# Or any static host
bun run build
# Upload .next/standalone to host
```

### Phase 2: Federation-hosted (Future)

Add to federation meta:

```json
{
  "sites": [
    {
      "id": "community-marketplace",
      "title": "Community Marketplace",
      "url": "https://your-marketplace.vercel.app",
      "description": "P2P commerce powered by Bitcoin"
    }
  ]
}
```

## Project Structure

```
fedi-agentry-marketplace/
├── app/
│   ├── components/
│   │   └── marketplace/
│   │       ├── ListingCard.tsx      # Listing display card
│   │       └── PaymentFlow.tsx      # Payment UI flow
│   ├── hooks/
│   │   └── useWallet.ts             # WebLN/Nostr hook
│   ├── page.tsx                     # Main marketplace page
│   └── layout.tsx                   # Root layout
├── lib/
│   ├── agentry.ts                   # Agentry API client
│   ├── webln.ts                     # WebLN/Nostr wrapper
│   ├── drizzle/
│   │   └── schema.ts                # Database schema
│   └── utils.ts                     # Utility functions
├── public/                          # Static assets
├── .env.example                     # Environment template
├── package.json                     # Dependencies
└── README.md                        # This file
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| WebLN not detected | Ensure running in Fedi app, not standalone browser |
| NIP-04 not available | Check Fedi version, may need update |
| Agentry API errors | Check network, verify API endpoints |
| Database connection | Verify DATABASE_URL in .env |
| Build errors | Delete `.next/` and `node_modules/`, reinstall |

### Debug Logging

Enable verbose logging:

```typescript
// lib/webln.ts
const DEBUG = true;

if (DEBUG) {
  console.log('[WebLN]', 'State:', state);
  console.log('[Nostr]', 'Event:', event);
}
```

### Testing Without Fedi

Use browser extension wallets:
- WebLN: Alby, GetAlby
- Nostr: nos2x, Alby

```typescript
// Mock providers for testing
if (!window.webln) {
  // Load mock webln for development
  await import('@getalby/lightning-tools');
}
```

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Resources

- [Fedi Docs](https://fedibtc.github.io/fedi-docs/)
- [ModBoilerplate](https://github.com/fedibtc/ModBoilerplate)
- [Fedi Mods Spec](https://github.com/fedibtc/fedi-mods/blob/master/specs.md)
- [Agentry API](https://api.agentry.com/docs)
- [Cashu Protocol](https://github.com/cashubtc/cashu)
- [Nostr NIPs](https://github.com/nostr-protocol/nips)

## License

MIT License - see LICENSE file for details

---

Built with ⚡ by the community for the community.
