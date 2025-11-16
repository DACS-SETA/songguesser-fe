import { Routes } from '@angular/router';
import { RoleAGuard } from './core/guards/role.guard';
import { RoleBGuard } from './core/guards/role.guard';
import { GameComponent } from './game/game.component';
import { RankingComponent } from './ranking/ranking.component';

export const routes: Routes = [

  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { 
    path: 'home',
    loadComponent: () => import('./home/home').then(m => m.HomeComponent)
  },
  { 
    path: 'game',
    component: GameComponent 
  },
  { 
    path: 'ranking',
    loadComponent: () => import('./ranking/ranking.component')
      .then(m => m.RankingComponent)
  },
  { 
    path: '**',
    redirectTo: '/home'
  }
];
