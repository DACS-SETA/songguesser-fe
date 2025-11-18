import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RankingService } from '../core/services/ranking.service';
import { UserRanking } from '../core/models/UserRanking';
import { RouterModule } from '@angular/router';
import { KeycloakService } from '../core/services/keycloak.service';

@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [CommonModule,RouterModule], 
  templateUrl: './ranking.component.html',
  styleUrls: ['./ranking.component.scss', '../game/game.component.css']
})
export class RankingComponent implements OnInit {

  ranking: UserRanking[] = [];

  constructor(private rankingService: RankingService, private keycloakService: KeycloakService) {}

 ngOnInit(): void {
  this.rankingService.getRanking().subscribe({
    next: (ranking) => {
      console.log("Ranking recibido:", ranking);
      this.ranking = ranking;  
    },
    error: (err) => {
      console.error("Error al obtener ranking", err);
    }
  });
}

  logout(): void {
    this.keycloakService.logout();
  }
}
