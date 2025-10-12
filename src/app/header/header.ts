import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { KeycloakService } from '../core/services/keycloak.service';
import { KeycloakProfile } from 'keycloak-js';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  isLoggedIn = false;
  userProfile: KeycloakProfile | null = null;
  showUserMenu = false;

  constructor(private keycloakService: KeycloakService) {}

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
    if (this.isLoggedIn) {
      this.userProfile = this.keycloakService.getUserProfile();
    }
  }

  private subscribeToUserProfile(): void {
    this.keycloakService.userProfile$
      .pipe(takeUntil(this.destroy$))
      .subscribe(profile => {
        this.userProfile = profile;
        this.isLoggedIn = !!profile;
      });
  }

  login(): void {
    this.keycloakService.login();
  }

  logout(): void {
    this.keycloakService.logout();
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  getFullName(): string {
    return this.keycloakService.getFullName();
  }

  getEmail(): string {
    return this.keycloakService.getEmail();
  }

  getUsername(): string {
    return this.keycloakService.getUsername();
  }

  getUserRoles(): string[] {
    return this.keycloakService.getUserRoles();
  }

  hasRole(role: string): boolean {
    return this.keycloakService.hasRole(role);
  }

  goToAccount(): void {
    window.open(this.keycloakService.getAccountUrl(), '_blank');
  }
}
