export interface ItunesSearchResponse {
  resultCount: number;
  results: SongSearchResult[];
}

export interface SongSearchResult {
  trackId: number;
  artistName: string;
  trackName: string;
  artworkUrl100: string;
}
