import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-alert-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  templateUrl: './alert-detail.component.html',
  styleUrls: ['./alert-detail.component.css']
})
export class AlertDetailComponent implements OnInit {
  alerta: any;

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.api.getAlertas().subscribe({
        next: (data) => (this.alerta = data.find((a: any) => a.id === id)),
        error: (err) => console.error('Error al cargar alerta:', err)
      });
    }
  }
}
