import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import * as Stomp from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private stompClient?: Client;
  private connected = false;

  private productUpdatesSubject = new Subject<any>();
  productUpdates$ = this.productUpdatesSubject.asObservable();

  private alertsSubject = new Subject<any>();
  alerts$ = this.alertsSubject.asObservable();

  constructor() {}

  /** 🔹 Conectar al WebSocket backend */
  connect(): void {
    if (this.connected) return;

    // URL del backend WebSocket
    const socket = new SockJS('http://localhost:8080/ws');
    this.stompClient = Stomp.Stomp.over(socket); // <-- Usa Stomp.Stomp.over()

    this.stompClient.onConnect = () => {
      this.connected = true;
      console.log('✅ WebSocket conectado');
      this.subscribeToProductTopic();
      this.subscribeToAlertsTopic();
    };

    this.stompClient.onWebSocketError = (error) =>
      console.error('❌ Error en conexión WebSocket:', error);

    this.stompClient.onStompError = (frame) =>
      console.error('❌ Error STOMP:', frame);

    this.stompClient.activate();
  }

  /** 🔹 Escuchar productos */
  private subscribeToProductTopic(): void {
    this.stompClient?.subscribe('/topic/productos', (message: IMessage) => {
      if (message.body) {
        const data = JSON.parse(message.body);
        this.productUpdatesSubject.next(data);
      }
    });
  }

  /** 🔹 Escuchar alertas */
  private subscribeToAlertsTopic(): void {
    this.stompClient?.subscribe('/topic/alertas', (message: IMessage) => {
      if (message.body) {
        const data = JSON.parse(message.body);
        this.alertsSubject.next(data);
      }
    });
  }

  /** 🔹 Permitir suscripción directa desde componentes */
  subscribeToAlerts(callback: (alert: any) => void): void {
    this.alerts$.subscribe(callback);
  }

  /** 🔹 Desconectar */
  disconnect(): void {
    if (this.stompClient && this.connected) {
      this.stompClient.deactivate();
      this.connected = false;
      console.log('🔌 WebSocket desconectado');
    }
  }
}
