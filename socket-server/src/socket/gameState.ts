import { Player, DrawingSubmission } from "../types/interfaces";

export class GameState {
  private players: Player[] = [];
  private songData: any = null;
  private drawingSubmissions: DrawingSubmission[] = [];
  private gameInProgress: boolean = false;
  private adminSocketId: string | null = null;

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

  isAdmin(socketId: string): boolean {
    return this.adminSocketId === socketId;
  }

  getAdminSocketId(): string | null {
    return this.adminSocketId;
  }

  setAdmin(socketId: string) {
    this.adminSocketId = socketId;
  }

  removeAdmin() {
    this.adminSocketId = null;
  }

  addPlayer(player: Player): void {
    this.players = this.players.filter((p) => p.id !== player.id);
    this.players.push(player);
  }

  removePlayer(socketId: string): Player | undefined {
    const player = this.players.find((p) => p.socketId === socketId);
    this.players = this.players.filter((p) => p.socketId !== socketId);

    if (socketId === this.adminSocketId) {
      this.adminSocketId = null;
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

  removeAllPlayers(): void {
    this.players = this.players.filter(player => 
      player.socketId === this.adminSocketId
    );
    this.gameInProgress = false;
    this.drawingSubmissions = [];
  }
}
