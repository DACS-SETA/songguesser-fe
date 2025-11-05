import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameManagementService } from '../core/services/game-management.service';
import { RoundState, GameSummary } from '../core/models/game.model';
import { SongSearchResult } from '../core/models/song-search-result.model';
import { debounceTime, distinctUntilChanged, Subject, switchMap, takeUntil } from 'rxjs';
import { SongService } from '../core/services/song.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnDestroy {
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
  showRoundSummaryModal = false;
  lastRoundInfo: RoundState | null = null;


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

  startGame(): void {
    this.resetGame();
    this.isGameActive = true;
    this.gameManagementService.startGame().subscribe({
      next: (response: RoundState) => {
        this.currentGameId = response.gameId;
  this.songUrl = response.song.previewUrl;
  this.songTitle = response.song.trackName.trim();
        this.songArtwork = response.song.artworkUrl100;

        this.initAudio();
        // El backend no devuelve 'round' en ocasiones, lo seteamos manualmente por ahora
        this.currentRound = response.round || 1;
        this.resultMessage = `Ronda ${this.currentRound} iniciada.`;
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
    this.audio.pause();
    this.isPlaying = false;
    this.isRevealed = true;
    this.showNextButton = false;
    this.resultMessage = `¡Se acabó el tiempo! La canción era: "${this.songTitle}". Partida finalizada.`;
    // Obtener el resumen de la partida y mostrar el modal
    if (this.currentGameId) {
      this.gameManagementService.getGameSummary(this.currentGameId).subscribe({
        next: (summary: GameSummary) => this.showSummary(summary),
        error: (err) => {
          console.error('Error al obtener resumen tras gameOver:', err);
          // mantener el mensaje de tiempo acabado si falla
        }
      });
    }
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
          this.resultMessage = '🎉 ¡Correcto! Era "' + this.songTitle + '"';
          this.audio.pause();
          this.lastRoundInfo = response;
          this.showRoundSummaryModal = true;
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
    this.showRoundSummaryModal = false;
    this.lastRoundInfo = null;
    if (!this.currentGameId) return;
    this.gameManagementService.surrender(this.currentGameId).subscribe({
      next: (response: GameSummary) => {
        // (RF11, RF14)
        clearTimeout(this.roundTimer);
        this.audio.pause();
        this.showNextButton = false;
        // Mostrar resumen de la partida en modal
        this.showSummary(response);
      },
      error: (err) => {
        console.error('Error al rendirse:', err);
        this.resultMessage = 'Error al intentar rendirse.';
      }
    });
  }

  nextRound(): void {
    this.showRoundSummaryModal = false;
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
        this.currentRound = response.round || this.currentRound + 1;
        this.resultMessage = `Ronda ${this.currentRound} iniciada.`;

        // Initialize audio for the new round
        this.initAudio();
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
    this.resetGame();
    this.startGame();
  }

  goToHome(): void {
    this.showSummaryModal = false;
    this.gameSummary = null;
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
