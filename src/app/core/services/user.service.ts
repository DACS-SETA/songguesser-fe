import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { KeycloakService } from './keycloak.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private baseUrl = environment.backendForFrontendUrl + '/users';

  constructor(private http: HttpClient, private keycloakService: KeycloakService) {}

  async syncUser() {
    const user = this.keycloakService.getUserIdentity();

    if (!user.keycloakId) {
      console.warn('No se encontró keycloakId, no se sincroniza usuario');
      return;
    }

console.log(user)


  const userDto = {
    keycloakId: user.keycloakId,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName
  };

    try {
      await this.http.post(`${this.baseUrl}/sync`, userDto).toPromise();
      console.log('✅ Usuario sincronizado con backend:', user.username);
    } catch (error) {
      console.error('❌ Error al sincronizar usuario:', error);
    }
  
}

}
