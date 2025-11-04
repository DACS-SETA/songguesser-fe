import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameManagementService } from '../core/services/game-management.service';
import { RoundState, GameSummary } from '../core/models/game.model';
import { SongSearchResult } from '../core/models/song-search-result.model';
import { debounceTime, distinctUntilChanged, Subject, switchMap, takeUntil } from 'rxjs';
import { SongService } from '../core/services/song.service';

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


  audio!: HTMLAudioElement;
  currentTime = 0;
  currentLevel = 0;
  playRanges = [5, 15, 30];
  intervalId: any;
  isPlaying = false;

  // Songs suggest input
  searchResults: SongSearchResult[] = [];
  private searchTerms = new Subject<string>();
  showSuggestions = false;
    private destroy$ = new Subject<void>();


  constructor(private songService: SongService, private gameManagementService: GameManagementService) {}

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

  initAudio(): void {
    if (this.songUrl) {
      this.audio = new Audio(this.songUrl);
      this.audio.volume = 0.8;

      this.audio.addEventListener('timeupdate', () => {
        this.currentTime = this.audio.currentTime;
      });
    }
  }

  playNextSegment(): void {
    if (!this.audio) return;
    if (this.currentLevel >= this.playRanges.length) {
      this.resultMessage = '🎵 Ya escuchaste el fragmento completo (30s)';
      return;
    }

    this.isPlaying = true;
    this.audio.currentTime = 0;
    this.audio.play();

    const endTime = this.playRanges[this.currentLevel];
    this.currentLevel++;

    clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      if (this.audio.currentTime >= endTime) {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.isPlaying = false;
        clearInterval(this.intervalId);
      }
    }, 200);
  }

  repeatSegment(): void {
    if (!this.audio || this.currentLevel === 0) return;
    const endTime = this.playRanges[this.currentLevel - 1];
    this.isPlaying = true;
    this.audio.currentTime = 0;
    this.audio.play();

    clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      if (this.audio.currentTime >= endTime) {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.isPlaying = false;
        clearInterval(this.intervalId);
      }
    }, 200);
  }

  submitGuess(): void {
    if (!this.userGuess.trim() || !this.currentGameId) return;

    console.log('Enviando al backend:', this.userGuess.trim());
    console.log('Respuesta correcta (guardada):', this.songTitle);

    this.gameManagementService.submitGuess(this.currentGameId, this.userGuess.trim()).subscribe({
      next: (response: RoundState) => {
        if (response.isCorrect) {
          this.isCorrect = true;
          this.resultMessage = '🎉 ¡Correcto! Era "' + this.songTitle + '"';
          this.audio.pause();
          this.showNextButton = true; // (RF10)
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
    if (!this.currentGameId) return;
    this.gameManagementService.surrender(this.currentGameId).subscribe({
      next: (response: GameSummary) => {
        // (RF11, RF14)
        this.isRevealed = true;
        this.resultMessage = `Te rendiste. La canción era: "${this.songTitle}". Partida finalizada.`;
        this.audio.pause();
        this.showNextButton = false;
        // Aquí deberíamos mostrar el modal de resumen de partida (GameSummaryModalComponent)
        console.log('Resumen de partida:', response);
      },
      error: (err) => {
        console.error('Error al rendirse:', err);
        this.resultMessage = 'Error al intentar rendirse.';
      }
    });
  }

  nextGame(): void {
    this.showNextButton = false;
    this.startGame();
  }

  resetGame(): void {
    this.userGuess = '';
    this.resultMessage = '';
    this.isCorrect = false;
    this.isRevealed = false;
    this.songUrl = null;
    this.songTitle = null;
    this.currentLevel = 0;
    this.currentTime = 0;
    this.showNextButton = false;
    clearInterval(this.intervalId);
    if (this.audio) this.audio.pause();
    this.isPlaying = false;
  }

   ngOnDestroy(): void {
    if (this.audio) this.audio.pause();
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
