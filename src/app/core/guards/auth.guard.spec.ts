import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['getToken']);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authService }]
    });

    guard = TestBed.inject(AuthGuard);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  it('should allow activation when token is valid', () => {
    authService.getToken.and.returnValue('valid-token-with-length');

    const canActivate = guard.canActivate();

    expect(canActivate).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to login when token is missing or invalid', () => {
    authService.getToken.and.returnValue(null);

    const canActivate = guard.canActivate();

    expect(canActivate).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
