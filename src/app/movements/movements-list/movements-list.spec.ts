import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';

import { MovementListComponent } from './movements-list.component';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

describe('MovementListComponent', () => {
  let component: MovementListComponent;
  let fixture: ComponentFixture<MovementListComponent>;
  let apiService: jasmine.SpyObj<ApiService>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    apiService = jasmine.createSpyObj<ApiService>('ApiService', ['getMovimientosPage', 'getProductos']);
    apiService.getMovimientosPage.and.returnValue(of({ content: [], totalElements: 0, number: 0, size: 10 }));
    apiService = jasmine.createSpyObj<ApiService>('ApiService', ['getMovimientos', 'getProductos']);
    apiService.getMovimientos.and.returnValue(of([]));
    apiService.getProductos.and.returnValue(of([]));

    authService = jasmine.createSpyObj<AuthService>('AuthService', ['getUserFromToken']);
    authService.getUserFromToken.and.returnValue('user');

    await TestBed.configureTestingModule({
      imports: [MovementListComponent, RouterTestingModule],
      providers: [
        { provide: ApiService, useValue: apiService },
        { provide: AuthService, useValue: authService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MovementListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to new movement when nuevoMovimiento is called', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate');

    component.nuevoMovimiento();

    expect(navigateSpy).toHaveBeenCalledWith(['/movements/new']);
  });

  it('should request the selected page when cambiarPagina is invoked', () => {
    const evento = { pageIndex: 1, pageSize: 25 } as PageEvent;

    component.cambiarPagina(evento);

    expect(apiService.getMovimientosPage).toHaveBeenCalledWith(1, 25);
  });
});
