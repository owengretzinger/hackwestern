'use client';

import { useState } from 'react';
import { connect, disconnect } from "starknetkit";
import type { StarknetWindowObject } from "starknetkit";

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
        <span className="text-sm">Connected: {address.slice(0, 6)}...{address.slice(-4)}</span>
        <button
          onClick={disconnectWallet}
          className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded-md hover:bg-red-50"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connectWallet}
      disabled={connecting}
      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
    >
      {connecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}