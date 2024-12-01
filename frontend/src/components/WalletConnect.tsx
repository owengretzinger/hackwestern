'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { useGameState } from "@/context/game-state";

export function WalletConnect() {
  const { gameState, updateWallet } = useGameState();
  const [connecting, setConnecting] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Get current player's wallet address from game state
  const currentPlayer = gameState.players.find(p => p.id === gameState.playerId);
  const walletAddress = currentPlayer?.walletAddress;

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const connectWallet = async () => {
    if (!gameState.playerId) return;
    
    try {
      setConnecting(true);
      const { connect, disconnect } = await import("starknetkit");
      
      // First disconnect any existing connections
      await disconnect();
      
      // Then connect with a new session
      const result = await connect();
      
      if (result && result.wallet) {
        updateWallet(result.wallet.account.address);
      }
    } catch (error) {
      console.error("Failed to connect:", error);
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      const { disconnect } = await import("starknetkit");
      await disconnect();
      updateWallet(undefined);
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  };

  // Don't render anything until after mounting to prevent hydration errors
  if (!mounted) return null;

  if (walletAddress) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
        </span>
        <Button
          onClick={disconnectWallet}
          variant="outline"
          className="text-destructive border-destructive hover:bg-destructive/10"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={connectWallet}
      disabled={connecting || !gameState.playerId}
      variant="outline"
      className="w-full"
    >
      {connecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
}
