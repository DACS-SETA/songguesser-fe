import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { KeycloakService } from 'keycloak-angular';
import { keycloakInitOptions } from './core/config/keycloak.config';

import { routes } from './app.routes';
import { INTERCEPTOR_CONFIG } from './core';

function initializeKeycloak(keycloak: KeycloakService) {
  return async () => {
    console.log('🔄 Inicializando Keycloak...');
    const authenticated = await keycloak.init(keycloakInitOptions);
    console.log('✅ Keycloak listo:', authenticated);
    console.log('🔑 Token:', await keycloak.getToken());
  };
}


export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    KeycloakService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService]
    },
     provideHttpClient(withInterceptorsFromDi()), 
    ...INTERCEPTOR_CONFIG,

  ]
};

