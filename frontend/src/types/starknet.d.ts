declare module '@starknet-react/core' {
  import { ReactNode } from 'react';

  export interface InjectedConnectorOptions {
    id: string;
  }

  export class InjectedConnector {
    constructor(options: { options: InjectedConnectorOptions });
    id: string;
  }

  export interface StarknetConfigProps {
    children: ReactNode;
    autoConnect?: boolean;
    connectors: InjectedConnector[];
  }

  export function StarknetConfig(props: StarknetConfigProps): JSX.Element;

  export function useAccount(): {
    address?: string;
    isConnected: boolean;
    isReconnecting: boolean;
    isDisconnected: boolean;
  };

  export function useConnectors(): {
    connect: (connector: InjectedConnector) => Promise<void>;
    disconnect: () => Promise<void>;
    available: InjectedConnector[];
  };
} 