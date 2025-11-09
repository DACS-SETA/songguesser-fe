import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { from, Observable } from 'rxjs';
import { KeycloakService } from '../services/keycloak.service';
import { mergeMap } from 'rxjs/operators';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private keycloakService: KeycloakService) {}

 intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  return from(this.keycloakService.getToken()).pipe(
    mergeMap(token => {
      console.log('🛰️ [AuthInterceptor] Token recibido:', token ? token.substring(0, 25) + '...' : '❌ sin token');
      console.log('📡 [AuthInterceptor] URL destino:', req.url);

      if (token && !this.isAssetRequest(req.url)) {
        const authReq = req.clone({
          setHeaders: { Authorization: `Bearer ${token}` }
        });
        return next.handle(authReq);
      }

      console.warn('⚠️ [AuthInterceptor] Request sin token:', req.url);
      return next.handle(req);
    })
  );
}


  private isAssetRequest(url: string): boolean {
    return (
      url.includes('/assets/') ||
      url.endsWith('.json') ||
      url.endsWith('.css') ||
      url.endsWith('.js') ||
      url.endsWith('.ico')
    );
  }
}
