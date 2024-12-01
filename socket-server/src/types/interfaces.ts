export interface Player {
  id: string;
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
