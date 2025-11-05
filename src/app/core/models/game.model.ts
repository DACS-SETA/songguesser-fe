// Modelo para la canción que viene del BFF
export interface GameSong {
  trackId: number;
  trackName: string;
  artworkUrl100: string;
  previewUrl: string;
  artistName: string; // <-- Agregá esta línea
}

// Respuesta al iniciar o enviar una ronda
export interface RoundState {
  gameId: string;
  song: GameSong;
  round: number;
  score: number;
  isCorrect: boolean | null; // Null si la ronda recién empieza
  isFinished: boolean;
}

// Respuesta del resumen del juego
export interface GameSummary {
  gameId: string;
  totalScore: number;
  totalRounds: number;
  correctRounds: number;
  // 'rounds' es opcional ya que no lo usaremos en el modal
}
