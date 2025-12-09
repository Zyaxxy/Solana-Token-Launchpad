import './App.css'
import { TokenLaunchpad } from './components/TokenLaunchpad'
import { Background } from './components/Background'

// wallet adapter imports
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import {
  WalletModalProvider,
  WalletDisconnectButton,
  WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';

function App() {
  return (
    <ConnectionProvider endpoint={"https://api.devnet.solana.com"}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
          <div className="relative min-h-screen w-full overflow-x-hidden">
            <Background />
            <header className='navbar mt-6'>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Launchpad</span>
              </div>
              <div className='flex items-center gap-2'>
                <WalletMultiButton />
                <WalletDisconnectButton />
              </div>
            </header>
            <TokenLaunchpad />
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default App
