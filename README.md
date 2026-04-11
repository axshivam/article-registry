# Article Registry — On-Chain Article Storage on Solana

A full-stack decentralised application that lets any wallet owner **publish, update, and delete articles** stored permanently on the Solana blockchain. Each article is a Program Derived Address (PDA) owned exclusively by its author — no centralised server, no database.

**Live program (Devnet):** [`3HghJSSrCCTuW63nhMintkNatfMsqEFgUAGvJNHtADMa`](https://explorer.solana.com/address/3HghJSSrCCTuW63nhMintkNatfMsqEFgUAGvJNHtADMa?cluster=devnet)

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [On-Chain Account Schema](#on-chain-account-schema)
- [Program Instructions](#program-instructions)
- [Error Codes](#error-codes)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Running the Frontend](#running-the-frontend)
- [Running Tests](#running-tests)
- [Deploying to Devnet](#deploying-to-devnet)
- [Contributing](#contributing)

---

## Features

- **Publish articles on-chain** — title, abstract, full content, references, and publish date stored in a Solana PDA
- **Update articles** — description, content, and references are mutable; title and publish date are immutable
- **Delete articles** — closes the PDA account and returns the rent lamports to the owner
- **Owner-only writes** — `has_one` constraints enforce that only the wallet that created an article can modify or delete it
- **Auto-derived PDAs** — no manual account addresses; the client resolves accounts from `[title, owner]` seeds automatically
- **React + Vite frontend** — Tailwind CSS UI with wallet adapter support (Phantom, Backpack, etc.)
- **Network-aware** — supports devnet / testnet / mainnet-beta via env variables

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                 React Frontend (Vite)           │
│  app/src/                                       │
│  ├── hooks/useArticleRegistry.ts  ← Anchor RPC │
│  ├── components/                               │
│  └── idl/article_registry.json   ← IDL         │
└───────────────────┬─────────────────────────────┘
                    │ @coral-xyz/anchor
                    ▼
┌─────────────────────────────────────────────────┐
│         Solana Blockchain (Devnet)              │
│                                                 │
│  Program: article_registry                      │
│  ID: 3HghJSSrCCTuW63nhMintkNatfMsqEFgUAGvJN... │
│                                                 │
│  PDAs seeded by [title_bytes, owner_pubkey]     │
│  Each PDA stores one ArticleEntry account       │
└─────────────────────────────────────────────────┘
```

### PDA Derivation

Every article lives at a deterministic address derived from the article's title and the owner's public key:

```
PDA = findProgramAddress(
  seeds: [title_as_bytes, owner_pubkey_as_bytes],
  program_id: 3HghJSSrCCTuW63nhMintkNatfMsqEFgUAGvJNHtADMa
)
```

This means:
- The same title can be used by different wallets (separate PDAs)
- The same wallet cannot publish two articles with identical titles
- Titles are **immutable** — changing a title would produce a different PDA

---

## Project Structure

```
article-registry/
├── Anchor.toml                    # Anchor workspace config (cluster, wallet, scripts)
├── Cargo.toml                     # Rust workspace manifest
├── package.json                   # Root JS devDependencies (ts-mocha, chai, anchor…)
├── tsconfig.json                  # Root TypeScript config (for tests)
│
├── programs/
│   └── article-registry/
│       ├── Cargo.toml             # Crate manifest (anchor-lang 0.31.1)
│       └── src/
│           └── lib.rs             # ← All on-chain program logic
│
├── tests/
│   └── article-registry.ts        # Mocha / Chai integration tests (runs on devnet)
│
├── migrations/
│   └── deploy.ts                  # Anchor migration script
│
└── app/                           # React frontend (Vite)
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── main.tsx               # Wallet adapter providers
        ├── App.tsx                # Root component with article grid
        ├── config.ts              # Cluster / RPC endpoint config
        ├── idl/
        │   └── article_registry.json  # ← Auto-generated IDL (copy from target/)
        ├── hooks/
        │   ├── useArticleRegistry.ts  # Anchor program interactions
        │   └── useNetworkStatus.ts    # RPC health + SOL balance
        ├── components/
        │   ├── ArticleCard.tsx        # Single article display
        │   ├── ArticleModal.tsx       # Create / edit form
        │   ├── ConfirmDeleteModal.tsx # Delete confirmation
        │   ├── FaucetWidget.tsx       # Devnet airdrop widget
        │   ├── Header.tsx
        │   ├── NetworkBanner.tsx
        │   ├── OnboardingGuide.tsx
        │   └── Toast.tsx
        └── context/
            └── ToastContext.tsx       # Global toast notifications
```

---

## On-Chain Account Schema

Each `ArticleEntry` PDA stores the following fields:

| Field | Type | Max Size | Mutable | Description |
|---|---|---|---|---|
| `owner` | `Pubkey` | 32 bytes | No | Wallet that created the article |
| `title` | `String` | 50 chars | No | Article title (also part of PDA seed) |
| `description` | `String` | 2000 chars | Yes | Short abstract / summary |
| `content` | `String` | 5000 chars | Yes | Full article body |
| `references` | `Vec<String>` | 5 × 200 chars | Yes | URLs or citations |
| `published_date` | `i64` | 8 bytes | No | Unix timestamp set at creation via `Clock` |

**Account space:** `8` (discriminator) + `ArticleEntry::INIT_SPACE` bytes, allocated up-front at creation using `#[derive(InitSpace)]` and `#[max_len(...)]` attributes — no `realloc` needed.

---

## Program Instructions

### `create_article_entry`

Creates a new article PDA. The signer pays for rent.

| Parameter | Type | Constraints |
|---|---|---|
| `title` | `String` | 1–50 chars, non-empty |
| `description` | `String` | 1–2000 chars, non-empty |
| `content` | `String` | 1–5000 chars, non-empty |
| `references` | `Vec<String>` | max 5 entries × max 200 chars each |

Sets `published_date` automatically via `Clock::get()?.unix_timestamp`.

### `update_article_entry`

Updates the mutable fields of an existing article. Only the original owner can call this.

| Parameter | Type | Constraints |
|---|---|---|
| `title` | `String` | Used to re-derive the PDA seed — not stored again |
| `description` | `String` | 1–2000 chars |
| `content` | `String` | 1–5000 chars |
| `references` | `Vec<String>` | max 5 entries × max 200 chars each |

`title` and `published_date` are never overwritten.

### `delete_article_entry`

Closes the PDA account and refunds all lamports to the owner. Only the original owner can call this.

| Parameter | Type | Description |
|---|---|---|
| `title` | `String` | Used to re-derive the PDA — account is then closed |

---

## Error Codes

| Code | Name | Message |
|---|---|---|
| 6000 | `TitleEmpty` | Title cannot be empty |
| 6001 | `TitleTooLong` | Title exceeds the maximum length of 50 characters |
| 6002 | `DescriptionEmpty` | Description cannot be empty |
| 6003 | `DescriptionTooLong` | Description exceeds the maximum length of 2000 characters |
| 6004 | `ContentEmpty` | Content cannot be empty |
| 6005 | `ContentTooLong` | Content exceeds the maximum length of 5000 characters |
| 6006 | `TooManyReferences` | References list exceeds the maximum of 5 entries |
| 6007 | `ReferenceTooLong` | A reference entry exceeds the maximum length of 200 characters |
| 6008 | `Unauthorized` | You are not authorized to modify or delete this article |

---

## Prerequisites

Install all tooling in the order listed below.

### 1 — Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup component add rustfmt clippy
```

### 2 — Solana CLI

```bash
curl --proto '=https' --tlsv1.2 -sSfL https://solana-install.solana.workers.dev | bash
# Verify
solana --version          # 1.18.x or later
```

### 3 — Anchor CLI (via AVM)

```bash
cargo install --git https://github.com/coral-xyz/anchor avm --force
avm install 0.31.1
avm use 0.31.1
# Verify
anchor --version          # anchor-cli 0.31.1
```

### 4 — Node.js & Yarn

```bash
# Node.js >= 20 recommended
node --version
npm install -g yarn
```

> **Version matrix used in this project**
>
> | Tool | Version |
> |---|---|
> | Rust | stable (1.79+) |
> | Solana CLI | 1.18.x |
> | Anchor CLI | 0.31.1 |
> | Node.js | 20.x |
> | Yarn | 1.x |

---

## Local Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd article-registry

# 2. Install root JS dependencies (mocha, chai, anchor testing utils)
yarn install

# 3. Install frontend dependencies
cd app && yarn install && cd ..

# 4. Generate a local Solana keypair (skip if you already have one)
solana-keygen new --outfile ~/.config/solana/id.json
solana airdrop 2 --url devnet    # Fund the wallet for deployment / tests
```

---

## Environment Variables

The frontend is configured via a `.env` file inside the `app/` directory. Copy the example and edit as needed:

```bash
cp app/.env.example app/.env
```

| Variable | Default | Description |
|---|---|---|
| `VITE_NETWORK` | `devnet` | Solana cluster (`devnet` / `testnet` / `mainnet-beta`) |
| `VITE_RPC_URL` | _(Solana public RPC)_ | Optional custom RPC endpoint |

Example `app/.env`:
```dotenv
VITE_NETWORK=devnet
# VITE_RPC_URL=https://your-custom-rpc.com
```

---

## Running the Frontend

```bash
cd app
yarn dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. Connect a Solana wallet (e.g. Phantom) pointed at **Devnet**.

To build a production bundle:

```bash
cd app
yarn build          # outputs to app/dist/
yarn preview        # preview the production build locally
```

---

## Running Tests

Tests run against **devnet** using `ts-mocha`. Make sure your wallet has devnet SOL before running.

```bash
# From the repo root
anchor test
```

The test suite covers:

| Suite | Cases |
|---|---|
| `createArticleEntry` | happy path, PDA determinism, multi-owner, empty title, oversized title, seed boundary (32 chars), empty description, oversized description, duplicate PDA rejection |
| `updateArticleEntry` | persists new values, immutability of title/owner, successive updates, empty description, oversized description, large description, non-owner rejection |
| `deleteArticleEntry` | lamport refund, post-deletion inaccessibility, re-creation after deletion, non-owner rejection, non-existent account rejection |

To run tests without restarting a validator:

```bash
anchor test --skip-local-validator
```

---

## Deploying to Devnet

After making changes to the Rust program:

```bash
# 1. Rebuild — this regenerates target/idl/ and target/types/
anchor build

# 2. Sync the fresh IDL into the frontend
cp target/idl/article_registry.json app/src/idl/article_registry.json

# 3. Deploy the upgraded binary
anchor deploy --provider.cluster devnet

# 4. Verify the program ID in lib.rs matches Anchor.toml and the IDL
#    declare_id!("...") in lib.rs
#    article_registry = "..." in Anchor.toml [programs.devnet]
#    "address": "..." in app/src/idl/article_registry.json
```

> **Important:** Always run `anchor build` before `anchor deploy`. Deploying a stale `.so` that was compiled with a different `declare_id!` causes the *"declared program id does not match"* runtime error.

---

## Contributing

Contributions are welcome! Please follow this workflow:

### Reporting Bugs

Open an issue describing:
1. Steps to reproduce
2. Expected behaviour
3. Actual behaviour (including any on-chain error codes)

### Pull Request Workflow

```bash
# Fork and clone the repo
git checkout -b feat/your-feature-name

# Make changes, then verify everything passes
anchor build                        # Rust compiles cleanly
cd app && npx tsc --noEmit && cd .. # No TypeScript errors
anchor test                         # All integration tests pass

# Commit and push
git add .
git commit -m "feat: describe your change"
git push origin feat/your-feature-name
```

Then open a Pull Request against `main`.

### Project Conventions

| Area | Convention |
|---|---|
| Rust | `snake_case` for functions and fields; errors prefixed with `ArticleError::` |
| TypeScript | `camelCase`; Anchor camelCase mapping from `snake_case` IDL fields applies automatically |
| IDL sync | After any Rust change run `anchor build` and copy the IDL — never hand-edit `article_registry.json` |
| Instruction args | Parameter names in Rust **must match** the PDA seed paths in `#[instruction(...)]` — using `_name` prefixes breaks client-side PDA auto-derivation |
| Account space | Use `#[derive(InitSpace)]` + `#[max_len(...)]` — do not compute space manually |
| Deployment | Always `anchor build` → copy IDL → `anchor deploy` in that order |

### Adding a New Field to `ArticleEntry`

1. Add the field to the `ArticleEntry` struct in `lib.rs` with the appropriate `#[max_len(...)]` if it is a `String` or `Vec`
2. Populate it in `create_article_entry` (and optionally `update_article_entry`)
3. Run `anchor build` — `INIT_SPACE` is recalculated automatically
4. Copy the new IDL: `cp target/idl/article_registry.json app/src/idl/article_registry.json`
5. Update the `Article` interface in `app/src/hooks/useArticleRegistry.ts`
6. Update `ArticleModal.tsx` (form field) and `ArticleCard.tsx` (display) as needed
7. Deploy: `anchor deploy --provider.cluster devnet`
