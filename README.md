# Veil

> Speak freely. Stay veiled. Powered by Stellar.

---

### 🟢 Level 4 Green Belt Submission
Reviewing this project for the Rise In / Stellar Level 4 review? All required evaluation evidence (proof of 10+ wallet interactions, contract addresses, user feedback, and screenshots) is organized in our **[Level 4 Submission Guide](SUBMISSION.md)**.

---

Veil is a **privacy-first anonymous chat application** built on the Stellar network. It features end-to-end encrypted messaging, wallet-based authentication, token-gated communities, DAO governance, and micropayments — all without requiring personal data.

## Features

- **End-to-End Encrypted** — Messages encrypted client-side with X25519 + AES-GCM. Not even the server can read them.
- **Zero Identity** — Connect with your Stellar wallet. No email, phone, or personal data required.
- **Token-Gated Rooms** — Create exclusive communities that require holding specific tokens to access.
- **DAO Governance** — Community-driven moderation through on-chain voting. No central authority.
- **Micropayments** — Tip message authors and pay for premium rooms with sub-cent Stellar transactions.
- **Global Access** — 475,000+ on/off ramp locations worldwide via Stellar anchors.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| UI | shadcn/ui (Radix UI), Lucide icons |
| Auth | SEP-10 (Stellar auth), Freighter wallet |
| Database | Supabase (PostgreSQL) |
| Real-time | Supabase Realtime |
| Blockchain | Stellar (Soroban smart contracts in Rust) |
| Encryption | Web Crypto API (X25519 + AES-GCM) |
| Key Storage | IndexedDB |
| Wallet | @stellar/freighter-api |
| Payments | Stellar SDK (XLM, USDC) |
| Hosting | Vercel |

## Getting Started

### Prerequisites

- Node.js >= 20.x
- pnpm (recommended)
- [Freighter wallet](https://www.freighter.app/) browser extension
- [Supabase](https://supabase.com) account

### Installation

```bash
# Clone the repository
git clone git@github.com:0xcoredev/Veil.git
cd Veil

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase and Stellar credentials

# Run database migrations in Supabase SQL Editor
# scripts/001_create_profiles.sql
# scripts/002_create_messages_rooms.sql
# scripts/003_room_members.sql
# scripts/004_token_gate.sql
# scripts/005_reputation.sql

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stellar
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
NEXT_PUBLIC_STELLAR_HORIZON_URL="https://horizon-testnet.stellar.org"
NEXT_PUBLIC_STELLAR_RPC_URL="https://soroban-testnet.stellar.org"
STELLAR_SERVER_SECRET=your-server-secret-key

# JWT
JWT_SECRET=your-jwt-secret-change-this
```

## Project Structure

```
veil/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # SEP-10 authentication
│   │   ├── rooms/                # Room CRUD
│   │   └── messages/             # Message send/fetch
│   ├── chat/                     # Chat interface
│   └── layout.tsx                # Root layout
├── components/                   # React components
│   ├── wallet-connector.tsx      # Freighter wallet integration
│   ├── header.tsx                # Navigation
│   └── ...                       # Landing page components
├── contracts/                    # Soroban smart contracts (Rust)
│   ├── token_gate/               # Token-gated room access
│   ├── governance/               # DAO voting
│   └── reputation/               # Non-transferable reputation
├── lib/
│   ├── crypto/                   # E2E encryption
│   │   ├── encryption.ts         # X25519 + AES-GCM
│   │   └── key-manager.ts        # IndexedDB key storage
│   ├── stellar/                  # Stellar integration
│   │   ├── auth.ts               # SEP-10 auth
│   │   ├── payments.ts           # Payment helpers
│   │   └── contracts.ts          # Soroban contract interaction
│   └── supabase/                 # Supabase clients
├── scripts/                      # Database migrations
└── types/                        # TypeScript types
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                     │
│  ┌─────────┐  ┌──────────┐  ┌───────────────────────┐  │
│  │ Wallet  │  │   Chat   │  │  Encryption Engine    │  │
│  │ Manager │  │   UI     │  │  (Web Crypto API)     │  │
│  └────┬────┘  └────┬─────┘  └───────────┬───────────┘  │
└───────┼────────────┼─────────────────────┼──────────────┘
        │            │                     │
        ▼            ▼                     ▼
┌─────────────────────────────────────────────────────────┐
│                   BACKEND (Node.js)                      │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────────┐ │
│  │ Auth     │  │  Supabase│  │  Message Queue        │ │
│  │ Service  │  │  (API)   │  │  (Redis)              │ │
│  └────┬─────┘  └────┬─────┘  └───────────┬───────────┘ │
└───────┼─────────────┼─────────────────────┼─────────────┘
        │             │                     │
        ▼             ▼                     ▼
┌─────────────────────────────────────────────────────────┐
│                  INFRASTRUCTURE                          │
│  ┌────────────┐  ┌──────────┐  ┌─────────────────────┐ │
│  │ Supabase   │  │  Stellar │  │  Soroban Contracts  │ │
│  │ (Postgres) │  │  Network │  │  (Token Gate, Gov)  │ │
│  └────────────┘  └──────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Smart Contracts

### Token Gate (`contracts/token_gate/`)
Manages token-gated room access. Users must hold a minimum balance of a specified token to join.

### Governance (`contracts/governance/`)
DAO-based moderation. Community members can propose and vote on actions (kick, ban, rule changes).

### Reputation (`contracts/reputation/`)
Non-transferable reputation tracking. Users earn points for messages sent and rooms created.

## Roadmap

- [x] Project setup and core infrastructure
- [x] Database schema and migrations
- [x] SEP-10 wallet authentication
- [x] Chat interface with rooms and messaging
- [x] E2E encryption with Web Crypto API
- [x] Soroban smart contracts
- [ ] Deploy contracts to testnet
- [ ] Micropayments and tipping
- [ ] Token-gated room UI
- [ ] DAO governance UI
- [ ] Mobile PWA optimization
- [ ] Security audit
- [ ] Mainnet deployment

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- [Stellar Development Foundation](https://stellar.org) — Blockchain infrastructure
- [Soroban](https://soroban.stellar.org) — Smart contract platform
- [Supabase](https://supabase.com) — Backend-as-a-service
- [Freighter](https://www.freighter.app/) — Stellar wallet
