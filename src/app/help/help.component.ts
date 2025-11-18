import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { KeycloakService } from '../core/services/keycloak.service';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.css']
})
export class HelpComponent implements OnInit {
  constructor(
    private keycloakService: KeycloakService,
    private router: Router
  ) { }

  ngOnInit(): void {}

  isLoggedIn(): boolean {
    return this.keycloakService.isLoggedIn();
  }

  async logout(): Promise<void> {
    await this.keycloakService.logout();
    this.router.navigate(['/home']);
  }

  goToHome(): void {
    this.router.navigate(['/home']);
  }

  activeSection: string = 'description';

  setActiveSection(section: string): void {
    this.activeSection = section;
  }
}
