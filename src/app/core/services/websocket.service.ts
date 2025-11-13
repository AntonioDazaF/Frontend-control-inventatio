import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import * as Stomp from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject } from 'rxjs';

/**
 * Gestiona la conexión WebSocket (STOMP) utilizada para recibir actualizaciones
 * en tiempo real de productos y alertas.
 */
@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private stompClient?: Client;
  private connected = false;

  private productUpdatesSubject = new Subject<any>();
  productUpdates$ = this.productUpdatesSubject.asObservable();

  private alertsSubject = new Subject<any>();
  alerts$ = this.alertsSubject.asObservable();

  constructor() {}

  /**
   * Establece la conexión con el backend WebSocket si no existe una conexión
   * activa.
   */
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

  /**
   * Suscribe el cliente STOMP al tópico de productos y propaga los mensajes.
   */
  private subscribeToProductTopic(): void {
    this.stompClient?.subscribe('/topic/productos', (message: IMessage) => {
      if (message.body) {
        const data = JSON.parse(message.body);
        this.productUpdatesSubject.next(data);
      }
    });
  }

  /**
   * Suscribe el cliente STOMP al tópico de alertas y propaga los mensajes.
   */
  private subscribeToAlertsTopic(): void {
    this.stompClient?.subscribe('/topic/alertas', (message: IMessage) => {
      if (message.body) {
        const data = JSON.parse(message.body);
        this.alertsSubject.next(data);
      }
    });
  }

  /**
   * Permite a los componentes subscribirse a la secuencia de alertas sin
   * exponer la implementación interna.
   *
   * @param callback Función a ejecutar por cada alerta recibida.
   */
  subscribeToAlerts(callback: (alert: any) => void): void {
    this.alerts$.subscribe(callback);
  }

  /**
   * Cierra la conexión con el WebSocket si se encuentra activa.
   */
  disconnect(): void {
    if (this.stompClient && this.connected) {
      this.stompClient.deactivate();
      this.connected = false;
      console.log('🔌 WebSocket desconectado');
    }
  }
}
