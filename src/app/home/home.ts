import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { KeycloakService } from '../core/services/keycloak.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  isLoggedIn = false;

  constructor(
    public keycloakService: KeycloakService,
    private router: Router
  ) {}

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
  }

  private subscribeToUserProfile(): void {
    this.keycloakService.userProfile$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isLoggedIn = this.keycloakService.isLoggedIn();
      });
  }

  login(): void {
    this.keycloakService.login();
  }

  logout(): void {
    this.keycloakService.logout();
  }

  startNewGame(): void {
    // Navegar a la página del juego
    this.router.navigate(['/game']);
  }
}
