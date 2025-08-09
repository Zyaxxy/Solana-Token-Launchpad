
# Token Launchpad (Solana Token-2022)

A modern React + Tailwind v4 dApp to create Token-2022 mints with metadata using Solana Wallet Adapter.

## Features
- Modern, responsive UI using a custom Tailwind theme (Mona Sans, gradients, utilities)
- Token-2022 mint creation with metadata pointer
- Wallet connect/disconnect via Wallet Adapter UI
- Clean form UX with validation and loading state

## Tech Stack
- React 18 + Vite 5
- Tailwind CSS v4 (via `@tailwindcss/postcss`)
- @solana/web3.js, @solana/spl-token, @solana/spl-token-metadata
- @solana/wallet-adapter-react, @solana/wallet-adapter-react-ui

## Getting Started
```bash
# Install deps
npm install

# Dev server
npm run dev

# Production build
npm run build
# Preview build
npm run preview
```

## Tailwind v4 Setup (already configured)
- `src/App.css` is the theme entry and includes:
  - `@import "tailwindcss";`
  - `@theme`, component classes, and `@utility` definitions
- PostCSS config: `postcss.config.js`
```js
import tailwindcss from '@tailwindcss/postcss'
export default { plugins: [tailwindcss()] }
```

## Environment
Optionally set the RPC endpoint in an env file (defaults to Devnet in code):
```env
VITE_SOLANA_NETWORK=devnet
```

## Project Structure
- `src/App.jsx`: App shell with navbar + wallet buttons
- `src/components/TokenLaunchpad.jsx`: Token creation form and logic
- `src/App.css`: Tailwind theme, utilities, and component classes

## UI Conventions
- Typography: `h1`, `h2`, `label`, and `input` styled via `src/App.css`
- Layout helpers: `.main-section`, `.page-heading`, `.navbar`
- Form structure: wrap fields in `.form-div` inside a `.gradient-border` container
- Buttons: `.auth-button` (primary), `.primary-button` (secondary)

## Troubleshooting Transactions
If you see `WalletSendTransactionError: Unexpected error`:
- Ensure fee payer: `transaction.feePayer = wallet.publicKey`
- Fetch a fresh blockhash: `transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash`
- Sign with all required signers (e.g. `mintKeypair` when creating a new mint):
```js
const sig = await wallet.sendTransaction(tx, connection, { signers: [mintKeypair] })
await connection.confirmTransaction({ signature: sig, ...(await connection.getLatestBlockhash()) }, 'confirmed')
```

## Notes
- We use `TOKEN_2022_PROGRAM_ID` and a metadata pointer extension.
- The UI is mobile-first and leverages the theme utilities for spacing and gradients.

## Repository
- GitHub: [Zyaxxy/Solana-Token-Launchpad](https://github.com/Zyaxxy/Solana-Token-Launchpad)

## License
MIT © 2025

