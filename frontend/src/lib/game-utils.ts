// src/utils/gameUtils.ts
import { Player } from "@/types/game";

export const generatePlayerId = () => {
  return Math.random().toString(36).substring(2, 7);
};

export const getPlayerById = (players: Player[], playerId: string) => {
  return players.find((p) => p.id === playerId);
};
