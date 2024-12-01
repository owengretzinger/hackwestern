'use client';

import { useState } from 'react';
import { connect, disconnect } from "starknetkit";
import type { StarknetWindowObject } from "starknetkit";
import { Button } from "@/components/ui/button";

export function WalletConnect() {
  const [address, setAddress] = useState<string | undefined>();
  const [connection, setConnection] = useState<StarknetWindowObject>();
  const [connecting, setConnecting] = useState(false);

  const connectWallet = async () => {
    try {
      setConnecting(true);
      const result = await connect();
      
      if (result && result.wallet) {
        setConnection(result.wallet);
        setAddress(result.wallet.account.address);
      }
    } catch (error) {
      console.error("Failed to connect:", error);
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    await disconnect();
    setConnection(undefined);
    setAddress(undefined);
  };

  if (address) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {address.slice(0, 6)}...{address.slice(-4)}
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
      disabled={connecting}
      variant="outline"
      className="w-full"
    >
      {connecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
} 