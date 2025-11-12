import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';  
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-alerts-list',
  standalone: true,
  imports: [
    CommonModule,          
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './alerts-list.component.html',
  styleUrls: ['./alerts-list.component.css']
})
export class AlertsListComponent implements OnInit {
  alertas: any[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getAlertas().subscribe({
      next: (data) => (this.alertas = data),
      error: (err) => console.error('Error cargando alertas:', err)
    });
  }
}