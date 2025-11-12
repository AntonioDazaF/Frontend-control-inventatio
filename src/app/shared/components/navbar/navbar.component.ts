import { Component, Input, OnInit } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

type RoleKey = 'admin' | 'supervisor' | 'operator' | 'default';

interface RoleDisplayConfig {
  label: string;
  displayName: string;
  avatarText: string;
  avatarClass: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  @Input() sidenav: any;

  userName = 'Invitado';
  userRoleLabel = 'Usuario';
  avatarText = 'US';
  avatarClass: RoleDisplayConfig['avatarClass'] = 'role-default';

  private readonly roleConfigMap: Record<RoleKey, RoleDisplayConfig> = {
    admin: {
      label: 'Administrador',
      displayName: 'Admin',
      avatarText: 'AD',
      avatarClass: 'role-admin'
    },
    supervisor: {
      label: 'Supervisor',
      displayName: 'Supervisor',
      avatarText: 'SU',
      avatarClass: 'role-supervisor'
    },
    operator: {
      label: 'Operador',
      displayName: 'Operador',
      avatarText: 'OP',
      avatarClass: 'role-operator'
    },
    default: {
      label: 'Usuario',
      displayName: 'Invitado',
      avatarText: 'US',
      avatarClass: 'role-default'
    }
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  logout(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('user');
    }
    this.router.navigate(['/login']);
  }

  toggleSidenav(): void {
    if (this.sidenav) {
      this.sidenav.toggle();
    }
  }

  private loadUserData(): void {
    const storedUser = this.getStoredUser();
    const normalizedRole = this.resolveRoleKey(
      storedUser?.rol ?? storedUser?.role ?? storedUser?.perfil
    );
    const config = this.roleConfigMap[normalizedRole];

    const firstName =
      storedUser?.nombre ??
      storedUser?.firstName ??
      storedUser?.name ??
      storedUser?.username ??
      storedUser?.nombreUsuario;
    const lastName =
      storedUser?.apellido ??
      storedUser?.lastName ??
      storedUser?.surname ??
      '';
    const displayName = [firstName, lastName].filter(Boolean).join(' ').trim();

    this.userName = displayName ? this.formatDisplayName(displayName) : config.displayName;
    this.userRoleLabel = config.label;
    this.avatarText = config.avatarText;
    this.avatarClass = config.avatarClass;
  }

  private getStoredUser(): any | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    try {
      const raw = window.localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private resolveRoleKey(roleValue: unknown): RoleKey {
    if (typeof roleValue !== 'string') {
      return 'default';
    }

    const normalized = roleValue.trim().toLowerCase();

    if (normalized.includes('admin')) {
      return 'admin';
    }

    if (normalized.includes('super')) {
      return 'supervisor';
    }

    if (normalized.includes('oper')) {
      return 'operator';
    }

    return 'default';
  }

  private formatDisplayName(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }
}
