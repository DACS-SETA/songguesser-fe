import { Routes } from '@angular/router';
import { RoleAGuard } from './core/guards/role.guard';
import { RoleBGuard } from './core/guards/role.guard';
import { GameComponent } from './game/game.component';

export const routes: Routes = [
  { path: '', redirectTo: '/game', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./home/home').then(m => m.HomeComponent) },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./dashboard-view/dashboard-view').then(m => m.DashboardViewComponent),
    canActivate: [RoleBGuard]
  },
  { path: 'game', component: GameComponent },

  { path: '**', redirectTo: '/' }
];
