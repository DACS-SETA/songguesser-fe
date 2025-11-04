import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { SongSearchResult, ItunesSearchResponse } from '../models/song-search-result.model';

export interface Song {
  trackId: number;
  artistName: string;
  trackName: string;
  artworkUrl100: string;
  previewUrl: string;
  primaryGenreName: string;
}

@Injectable({ providedIn: 'root' })
export class SongService extends BaseApiService {
  // Ya no necesitamos constructor ni apiUrl, se heredan desde BaseApiService

  searchSongs(query: string): Observable<SongSearchResult[]> {
    if (!query.trim()) {
      return of([]);
    }

    // Usamos this.get() del BaseApiService y esperamos el objeto completo ItunesSearchResponse
    return this.get<ItunesSearchResponse>(`itunes/search?term=${encodeURIComponent(query)}`)
      .pipe(
        // Extraemos solo el array 'results' del objeto
        map(response => response?.results || []),
        catchError(() => of([])) // Devuelve un array vacío si hay error
      );
  }
}
