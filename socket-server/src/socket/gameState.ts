import { Player, DrawingSubmission } from "../types/interfaces";

export class GameState {
  private players: Player[] = [];
  private songData: any = null;
  private drawingSubmissions: DrawingSubmission[] = [];
  private gameInProgress: boolean = false;

  getPlayers(): Player[] {
    return this.players;
  }

  getSongData(): any {
    return this.songData;
  }

  getDrawingSubmissions(): DrawingSubmission[] {
    return this.drawingSubmissions;
  }

  isGameInProgress(): boolean {
    return this.gameInProgress;
  }

  hasPlayers(): boolean {
    return this.players.length > 0;
  }

  addPlayer(player: Player): void {
    this.players = this.players.filter((p) => p.id !== player.id);
    player.isHost = !this.hasPlayers(); // Set host before adding to array
    this.players.push(player);
  }

  removePlayer(socketId: string): Player | undefined {
    const player = this.players.find((p) => p.socketId === socketId);
    this.players = this.players.filter((p) => p.socketId !== socketId);

    if (this.players.length > 0 && !this.players[0].isHost) {
      this.players[0].isHost = true;
    }
    if (this.players.length === 0) {
      this.gameInProgress = false;
    }

    return player;
  }

  addDrawingSubmission(submission: DrawingSubmission): void {
    this.drawingSubmissions.push(submission);
  }

  findPlayerBySocketId(socketId: string): Player | undefined {
    return this.players.find((p) => p.socketId === socketId);
  }

  setPlayerSubmitted(socketId: string, submitted: boolean = true): void {
    const player = this.findPlayerBySocketId(socketId);
    if (player) {
      player.hasSubmitted = submitted;
    }
  }

  haveAllPlayersSubmitted(): boolean {
    return this.players.every((p) => p.hasSubmitted);
  }

  startGame(): void {
    this.gameInProgress = true;
    this.players.forEach((p) => (p.hasSubmitted = false));
    this.songData = null;
    this.drawingSubmissions = [];
  }

  endGame(): void {
    this.gameInProgress = false;
  }

  setSongData(data: any): void {
    this.songData = data;
  }
}