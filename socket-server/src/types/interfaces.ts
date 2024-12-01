export interface Player {
  id: string;
  isHost: boolean;
  nickname: string;
  socketId: string;
  hasSubmitted?: boolean;
}

export interface DrawingSubmission {
  playerId: string;
  nickname: string;
  imageData: string;
  lyrics?: string[];
  description?: string;
}
