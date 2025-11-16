import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header';
import { KeycloakService } from './core/services/keycloak.service';
import { UserService } from './core/services/user.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  protected readonly title = signal('dacs-fe');

  constructor(
    private keycloakService: KeycloakService,
    private userService: UserService
  ) {}

  async ngOnInit() {
    if (this.keycloakService.isLoggedIn()) {
      await this.keycloakService.refreshUserProfile();   
      await this.userService.syncUser();
      
    }
  }
}
