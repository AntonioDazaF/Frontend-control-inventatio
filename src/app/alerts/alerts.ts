import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { ApiService } from '../../app/core/services/api.service';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './alerts.html',
  styleUrls: ['./alerts.css']
})
export class AlertsComponent implements OnInit {
  alertas: any[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getAlertas().subscribe({
      next: (data) => this.alertas = data,
      error: (err) => console.error('Error cargando alertas:', err)
    });
  }
}
