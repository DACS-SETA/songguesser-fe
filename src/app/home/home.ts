import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { KeycloakService } from '../core/services/keycloak.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  title = 'DACS Frontend - Pantalla Principal';
  isLoggedIn = false;
  hasRoleA = false;
  hasRoleB = false;

  constructor(public keycloakService: KeycloakService) {}

  ngOnInit(): void {
    this.checkLoginStatus();
    this.subscribeToUserProfile();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkLoginStatus(): void {
    this.isLoggedIn = this.keycloakService.isLoggedIn();
    this.updateRoleStatus();
  }

  private subscribeToUserProfile(): void {
    this.keycloakService.userProfile$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isLoggedIn = this.keycloakService.isLoggedIn();
        this.updateRoleStatus();
      });
  }

  private updateRoleStatus(): void {
    this.hasRoleA = this.keycloakService.hasRole('ROLE-A');
    this.hasRoleB = this.keycloakService.hasRole('ROLE-B');
  }

  login(): void {
    this.keycloakService.login();
  }

  canAccessTableGrid(): boolean {
    return this.isLoggedIn && this.hasRoleA;
  }

  canAccessDashboard(): boolean {
    return this.isLoggedIn && this.hasRoleB;
  }

  getAccessMessage(role: string): string {
    if (!this.isLoggedIn) {
      return 'Inicia sesión para acceder';
    }
    return `Se requiere ${role} para acceder`;
  }
}
