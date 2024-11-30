'use client';

import { StarknetConfig, InjectedConnector } from '@starknet-react/core';
import { ReactNode } from 'react';

export function StarknetConfigProvider({ children }: { children: ReactNode }) {
  const connectors = [
    new InjectedConnector({ options: { id: 'argentX' }}),
    new InjectedConnector({ options: { id: 'braavos' }})
  ];

  return (
    <StarknetConfig autoConnect connectors={connectors}>
      {children}
    </StarknetConfig>
  );
}