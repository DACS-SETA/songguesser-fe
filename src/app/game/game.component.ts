import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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
  searchResults: any[] = [];
  private searchTerms = new Subject<string>();
  showSuggestions = false;
    private destroy$ = new Subject<void>();


  constructor(private http: HttpClient, private songService: SongService) {}

  startGame(): void {
    this.resetGame();
    this.isGameActive = true;

    this.http.get<any>('http://localhost:9001/bff/itunes/random').subscribe({
      next: (res) => {
        this.songUrl = res.previewUrl;
        this.songTitle = res.trackName.toLowerCase().trim();
        this.songArtwork = res.artworkUrl100; 

        this.initAudio();
      },
      error: (err) => {
        console.error('Error fetching song', err);
        this.resultMessage = 'Error al obtener la canción.';
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
    if (!this.userGuess.trim()) return;

    if (this.userGuess.toLowerCase().trim() === this.songTitle) {
      this.isCorrect = true;
      this.resultMessage = '🎉 ¡Correcto! Era "' + this.songTitle + '"';
      this.audio.pause();
      this.showNextButton = true;
    } else {
      this.isCorrect = false;
      this.resultMessage = '❌ Incorrecto. Intenta nuevamente.';
    }
  }

  revealAnswer(): void {
    this.isRevealed = true;
    this.resultMessage = `La canción era: "${this.songTitle}"`;
    this.audio.pause();
    this.showNextButton = true;
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

  selectSuggestion(song: any): void {
    this.userGuess = song.trackName;
    this.showSuggestions = false;
  }

  closeSuggestions(): void {
    setTimeout(() => (this.showSuggestions = false), 200);
  }


}
