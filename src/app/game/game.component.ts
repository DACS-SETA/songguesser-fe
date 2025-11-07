import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { GameManagementService } from '../core/services/game-management.service';
import { RoundState, GameSummary } from '../core/models/game.model';
import { SongSearchResult } from '../core/models/song-search-result.model';
import { debounceTime, distinctUntilChanged, Subject, switchMap, takeUntil } from 'rxjs';
import { SongService } from '../core/services/song.service';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit, OnDestroy {
  isGameActive = false;
  songUrl: string | null = null;
  songTitle: string | null = null;
  currentGameId: string | null = null;
  currentRound: number = 0;
  userGuess = '';
  resultMessage = '';
  isCorrect = false;
  isRevealed = false;
  showNextButton = false;
  songArtwork: string | null = null;
  showSummaryModal = false;
  gameSummary: GameSummary | null = null;
  showRoundSummaryModal = false; // deprecado: será reemplazado por showOutcomeModal
  // Modal unificado de resultado de ronda
  showOutcomeModal = false;
  outcomeType: 'success' | 'surrender' | 'timeout' | null = null;
  lastRoundInfo: RoundState | null = null;
  
  // Countdown state
  showCountdown = false;
  countdownValue = 3;

  // Lost round modal state (deprecado showLostRoundModal)
  showLostRoundModal = false;
  surrenderedFlag = false;
  songArtist: string | null = null;

  // Math helper for template
  Math = Math;

  audio!: HTMLAudioElement;
  currentTime = 0;
  // Max playback time per round (seconds)
  readonly MAX_TIME = 30;
  hasPlayedThisRound = false;
  roundTimer: any;
  intervalId: any;
  isPlaying = false;

  // Songs suggest input
  searchResults: SongSearchResult[] = [];
  private searchTerms = new Subject<string>();
  showSuggestions = false;
    private destroy$ = new Subject<void>();


  constructor(private songService: SongService, private gameManagementService: GameManagementService, private router: Router) {}

  ngOnInit(): void {
    // Suscribirse al flujo del buscador
    this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => this.songService.searchSongs(term)),
      takeUntil(this.destroy$)
    ).subscribe(results => {
      this.searchResults = results;
      this.showSuggestions = results.length > 0;
    });

    // Iniciar automáticamente con countdown
    this.startCountdown();
  }

  startCountdown(): void {
    this.showCountdown = true;
    this.countdownValue = 3;

    const countdownInterval = setInterval(() => {
      this.countdownValue--;
      
      if (this.countdownValue === 0) {
        clearInterval(countdownInterval);
        this.showCountdown = false;
        this.startGame();
      }
    }, 1000);
  }

  startGame(): void {
    this.resetGame();
    this.isGameActive = true;
    this.gameManagementService.startGame().subscribe({
      next: (response: RoundState) => {
        this.currentGameId = response.gameId;
        this.songUrl = response.song.previewUrl;
        this.songTitle = response.song.trackName.trim();
  this.songArtwork = response.song.artworkUrl100;
  this.songArtist = response.song.artistName;

        this.initAudio();
        // El backend no devuelve 'round' en ocasiones, lo seteamos manualmente por ahora
        this.currentRound = response.round || 1;
        
        // Reproducir automáticamente al iniciar
        setTimeout(() => {
          this.playRound();
        }, 500);
      },
      error: (err) => {
        console.error('Error al iniciar el juego:', err);
        this.resultMessage = 'Error al iniciar el juego.';
        this.isGameActive = false;
      }
    });
  }

  private showSummary(summary: GameSummary): void {
    this.gameSummary = summary;
    this.showSummaryModal = true;
    this.isGameActive = false;
    this.isRevealed = true; // Asegura que los controles queden deshabilitados
    this.resultMessage = `Partida finalizada. Puntaje: ${summary.totalScore}`;
  }

  initAudio(): void {
    if (this.songUrl) {
      this.audio = new Audio(this.songUrl);
      this.audio.volume = 0.8;

      this.audio.addEventListener('timeupdate', () => {
        this.currentTime = this.audio.currentTime;
      });
    }
  }

  playRound(): void {
    if (!this.audio || this.hasPlayedThisRound) return;

    this.hasPlayedThisRound = true;
    this.isPlaying = true;
    this.audio.currentTime = 0;
    this.audio.play();

    // Limpia cualquier temporizador anterior
    clearTimeout(this.roundTimer);

    // Inicia el temporizador de 30 segundos para "Game Over"
    this.roundTimer = setTimeout(() => {
      // Solo finaliza el juego si para este punto NO han acertado
      if (!this.isCorrect) {
        this.gameOver();
      }
    }, this.MAX_TIME * 1000);

    // Inicia el intervalo para actualizar la UI (esto es opcional pero recomendado)
    this.intervalId = setInterval(() => {
      if (this.audio.currentTime >= this.MAX_TIME) {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.isPlaying = false;
        clearInterval(this.intervalId);
      }
    }, 200);
  }
  private gameOver(): void {
    if (this.audio) this.audio.pause();
    this.isPlaying = false;
    this.isRevealed = true;
    this.showNextButton = false;
    this.resultMessage = '';
    this.surrenderedFlag = false;
    this.outcomeType = 'timeout';
    this.showOutcomeModal = true;
  }

  submitGuess(): void {
    if (this.isRevealed) return;
    if (!this.userGuess.trim() || !this.currentGameId) return;

    console.log('Enviando al backend:', this.userGuess.trim());
    console.log('Respuesta correcta (guardada):', this.songTitle);

  this.gameManagementService.submitGuess(this.currentGameId, this.userGuess.trim(), Math.round(this.currentTime)).subscribe({
      next: (response: RoundState) => {
        if (response.isCorrect) {
          this.isCorrect = true;
          clearTimeout(this.roundTimer);
          this.resultMessage = ''; // No mostrar mensaje detrás del modal
          this.audio.pause();
          this.lastRoundInfo = response;
          this.outcomeType = 'success';
          this.showOutcomeModal = true;
        } else {
          this.isCorrect = false;
          this.resultMessage = '❌ Incorrecto. Intenta nuevamente.';
        }
      },
      error: (err) => {
        console.error('Error al enviar respuesta:', err);
        this.resultMessage = 'Error al procesar la respuesta.';
      }
    });
  }

  surrenderGame(): void {
    // Rendición: mostrar modal unificado
    this.lastRoundInfo = null;
    clearTimeout(this.roundTimer);
    if (this.audio) this.audio.pause();
    this.showNextButton = false;
    this.isPlaying = false;
    this.surrenderedFlag = true;
    this.outcomeType = 'surrender';
    this.showOutcomeModal = true;
  }

  finalizeGame(): void {
    if (!this.currentGameId) return;
    const isSurrender = this.outcomeType === 'surrender';
    if (isSurrender) {
      this.gameManagementService.surrender(this.currentGameId).subscribe({
        next: (response: GameSummary) => {
          this.showOutcomeModal = false;
          this.showSummary(response);
        },
        error: (err) => {
          console.error('Error al rendirse:', err);
          this.resultMessage = 'Error al intentar rendirse.';
        }
      });
    } else {
      this.gameManagementService.getGameSummary(this.currentGameId).subscribe({
        next: (summary: GameSummary) => {
          this.showOutcomeModal = false;
          this.showSummary(summary);
        },
        error: (err) => {
          console.error('Error al obtener resumen:', err);
        }
      });
    }
  }

  nextRound(): void {
    this.showOutcomeModal = false;
    this.outcomeType = null;
    this.lastRoundInfo = null;
    // Prepare local state for the next round
    this.showNextButton = false;
    this.resetRound();

    // Call backend to advance to next round
    if (!this.currentGameId) {
      this.resultMessage = 'No hay una partida activa.';
      return;
    }

    this.gameManagementService.nextRound(this.currentGameId!).subscribe({
      next: (response: RoundState) => {
        // Update UI/state with the new round data
        this.songUrl = response.song.previewUrl;
        this.songTitle = response.song.trackName.trim();
  this.songArtwork = response.song.artworkUrl100;
  this.songArtist = response.song.artistName;
        this.currentRound = response.round || this.currentRound + 1;

        // Initialize audio for the new round
        this.initAudio();
        
        // Reproducir automáticamente al iniciar la siguiente ronda
        setTimeout(() => {
          this.playRound();
        }, 500);
      },
      error: (err) => {
        console.error('Error al avanzar a la siguiente ronda:', err);
        this.resultMessage = 'Error al avanzar de ronda.';
      }
    });
  }

  // Reset only the round-specific state
  private resetRound(): void {
    this.userGuess = '';
    this.resultMessage = '';
    this.isCorrect = false;
    this.isRevealed = false;
    this.songUrl = null;
    this.songTitle = null;
    this.currentTime = 0;
    this.showNextButton = false;
    clearTimeout(this.roundTimer);
    clearInterval(this.intervalId);
    this.hasPlayedThisRound = false;
    if (this.audio) this.audio.pause();
    this.isPlaying = false;
  }

  resetGame(): void {
    // Reset round-specific fields
    this.resetRound();

    // Reset game-level fields
    this.isGameActive = false;
    this.currentGameId = null;
  }

  restartGame(): void {
    this.showSummaryModal = false;
    this.gameSummary = null;
    this.showOutcomeModal = false;
    this.outcomeType = null;
    this.resetGame();
    this.startCountdown(); // <-- Esta es la solución
  }

  goToHome(): void {
    this.showSummaryModal = false;
    this.gameSummary = null;
    this.showOutcomeModal = false;
    this.outcomeType = null;
    this.resetGame();
    this.router.navigate(["/home"]);
  }

   ngOnDestroy(): void {
    if (this.audio) this.audio.pause();
    clearTimeout(this.roundTimer);
    clearInterval(this.intervalId);
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Input suggestions 

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  onSearch(term: string): void {
    this.searchTerms.next(term);
  }

  selectSuggestion(song: SongSearchResult): void {
    this.userGuess = song.trackName.trim();
    this.showSuggestions = false;
    // Opcional: enfocar el input de nuevo si es necesario
  }

  closeSuggestions(): void {
    setTimeout(() => (this.showSuggestions = false), 200);
  }


}
