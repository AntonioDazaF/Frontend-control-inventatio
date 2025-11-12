import { TestBed } from '@angular/core/testing';
import { HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';

import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('AuthInterceptor', () => {
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['getToken']);

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: authService }]
    });
  });

  function runInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
    return TestBed.runInInjectionContext(() => AuthInterceptor(req, next));
  }

  it('should append the Authorization header when a token exists', () => {
    authService.getToken.and.returnValue('jwt-token');
    const request = new HttpRequest('GET', '/test');
    const next: jasmine.Spy<HttpHandlerFn> = jasmine
      .createSpy()
      .and.callFake((req) => of(new HttpResponse({ body: req })));

    runInterceptor(request, next).subscribe();

    const forwardedRequest = next.calls.mostRecent().args[0] as HttpRequest<unknown>;
    expect(forwardedRequest.headers.get('Authorization')).toBe('Bearer jwt-token');
    expect(next).toHaveBeenCalled();
  });

  it('should forward the original request when there is no token', () => {
    authService.getToken.and.returnValue(null);
    const request = new HttpRequest('POST', '/test', {});
    const next: jasmine.Spy<HttpHandlerFn> = jasmine
      .createSpy()
      .and.callFake((req) => of(new HttpResponse({ body: req })));

    runInterceptor(request, next).subscribe();

    const forwardedRequest = next.calls.mostRecent().args[0] as HttpRequest<unknown>;
    expect(forwardedRequest).toBe(request);
    expect(forwardedRequest.headers.has('Authorization')).toBeFalse();
  });
});
