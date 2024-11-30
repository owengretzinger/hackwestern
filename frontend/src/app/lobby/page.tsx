import Lobby from "@/components/lobby";
import { WalletConnect } from "@/components/WalletConnect";

export default function LobbyPage() {
  return (
    <div className="p-4">
      <div className="mb-8">
        <WalletConnect />
      </div>
      <Lobby />
    </div>
  );
}
