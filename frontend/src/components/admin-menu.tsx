"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import { useGameState } from "@/context/game-state";
import { useRouter } from "next/navigation";

export function AdminMenu() {
  const { socket, gameState } = useGameState();
  const router = useRouter();

  const handleForceSubmit = () => {
    if (socket) {
      socket.emit("forceSubmit");
    }
  };

  const handleKickEveryone = () => {
    if (socket) {
      console.log("Kicking everyone");
      socket.emit("kickEveryone");
    } else {
      console.log("Socket not found");
    }
  };

  const handleGoBackToMenu = () => {
    router.push("/");
  };

  if (!gameState.isAdmin) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleForceSubmit}>
          Force submit all
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleKickEveryone}>
          Kick everyone
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleGoBackToMenu}>
          Go back to menu
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
