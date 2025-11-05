import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { RoundState, GameSummary } from '../models/game.model';
import { BaseApiService } from './base-api.service';

export interface Game {
  id?: string;
  name?: string;
  players?: string[];
  state?: 'waiting' | 'playing' | 'finished' | string;
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class GameManagementService extends BaseApiService {
  // Local observable state for the currently active game in the client
  private gameState$ = new BehaviorSubject<Game | null>(null);

  constructor(http: HttpClient) {
    super(http);
  }

  // Start a game via BFF
  // POST bff/games/start (BaseApiService construye la URL completa)
  startGame(): Observable<RoundState> {
    return this.post<RoundState>('games/start', {});
  }

  // Submit a guess for the current round
  // POST bff/games/{gameId}/round  { guess, time }
  submitGuess(gameId: string, guess: string, time: number): Observable<RoundState> {
    return this.post<RoundState>(`games/${encodeURIComponent(gameId)}/round`, { guess, time });
  }

  // Advance to the next round
  // POST bff/games/{gameId}/round with null body
  nextRound(gameId: string): Observable<RoundState> {
    return this.post<RoundState>(`games/${encodeURIComponent(gameId)}/round`, null);
  }

  // Surrender a game
  // POST bff/games/{gameId}/surrender
  surrender(gameId: string): Observable<GameSummary> {
    return this.post<GameSummary>(`games/${encodeURIComponent(gameId)}/surrender`, {});
  }

  // Get game summary
  // GET bff/games/{gameId}/summary
  getGameSummary(gameId: string): Observable<GameSummary> {
    return this.get<GameSummary>(`games/${encodeURIComponent(gameId)}/summary`);
  }

  // Local state helpers
  setLocalGameState(game: Game | null): void {
    this.gameState$.next(game);
  }

  watchLocalGameState(): Observable<Game | null> {
    return this.gameState$.asObservable();
  }
}
