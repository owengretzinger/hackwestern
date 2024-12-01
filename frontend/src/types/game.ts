// src/types/game.ts
export interface Player {
  id: string;
  isHost: boolean;
  nickname: string;
}

export interface Verse {
  lyrics: string;
  image: string;
  author: string;
}

export interface Song {
  title: string;
  cover: string;
  verses: Verse[];
  genre: string;
  shortGenre: string;
  url: string;
}

export interface GameState {
  players: Player[];
  isHost: boolean;
  playerId: string | null;
  nickname: string;
  hasSubmittedDrawing: boolean;
  waitingForOthersToSubmit: boolean;
  isSubmittingDrawing: boolean;
  submitError: string | null;
  song: Song | null;
  isLoadingSong: boolean;
  allPlayersSubmitted: boolean;
  hasJoined: boolean;
  joinError: string | null;
}
