import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, debounceTime, Observable, of } from 'rxjs';

export interface Song {
  trackId: number;
  artistName: string;
  trackName: string;
  artworkUrl100: string;
  previewUrl: string;
  primaryGenreName: string;
}

@Injectable({ providedIn: 'root' })
export class SongService {
  private apiUrl = 'http://localhost:9001/bff/itunes';

  constructor(private http: HttpClient) {}

  getRandomSong(): Observable<Song> {
    return this.http.get<Song>(`${this.apiUrl}/random`);
  }

   searchSongs(query: string): Observable<any[]> {
    if (!query.trim()) {
      return of([]);
    }
    return this.http
      .get<any[]>(`${this.apiUrl}/search?term=${encodeURIComponent(query)}`)
      .pipe(
        debounceTime(300),
        catchError(() => of([]))
      );
  }
}
