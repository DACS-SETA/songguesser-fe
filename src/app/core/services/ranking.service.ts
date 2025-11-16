import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserRanking } from '../models/UserRanking';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class RankingService extends BaseApiService {

  constructor(http: HttpClient) {
    super(http);
  }

  // GET bff/users/ranking
  getRanking(): Observable<UserRanking[]> {
    return this.get<UserRanking[]>('users/ranking');
  }
}
