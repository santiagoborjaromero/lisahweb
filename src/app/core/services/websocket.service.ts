// src/app/services/websocket.service.ts

import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Observable, EMPTY, BehaviorSubject, timer } from 'rxjs';
import { tap, catchError, share, switchMap } from 'rxjs/operators';

export interface WebSocketState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  error?: string;
  lastMessage?: any;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private connections = new Map<string, WebSocketSubject<any>>();
  private states = new Map<string, BehaviorSubject<WebSocketState>>();

  constructor() {}

  /**
   * Conecta a un servidor WebSocket
   * @param serverId Identificador único del servidor
   * @param url URL del WebSocket (ws:// o wss://)
   * @param reconnect Si debe reconectar automáticamente
   */
  connect(serverId: string, url: string, reconnect = false): Observable<any> {
    // Si ya existe conexión, devolvemos el observable existente
    if (this.connections.has(serverId)) {
      console.warn(`Conexión ya activa para el servidor: ${serverId}`);
      return this.onMessage(serverId);
    }

    // Crear estado inicial
    const initialState: WebSocketState = {
      status: 'connecting',
      timestamp: Date.now()
    };
    const state$ = new BehaviorSubject<WebSocketState>(initialState);
    this.states.set(serverId, state$);

    // Crear WebSocket
    const wsSubject = webSocket<any>({
      url,
      openObserver: {
        next: () => {
          console.log(`✅ [WS] Conectado a ${serverId}`);
          state$.next({
            ...state$.value,
            status: 'connected'
          });
        }
      },
      closeObserver: {
        next: () => {
          console.log(`🔌 [WS] Conexión cerrada: ${serverId}`);
          state$.next({
            ...state$.value,
            status: 'disconnected'
          });
          this.cleanup(serverId);
        }
      }
    });

    // Guardar referencia
    this.connections.set(serverId, wsSubject);

    // Construir el observable con manejo de errores y reconexión condicional
    let observable$ = wsSubject.pipe(
      tap((msg) => {
        state$.next({
          ...state$.value,
          lastMessage: msg,
          timestamp: Date.now()
        });
      }),
      catchError((err) => {
        console.error(`❌ [WS] Error en ${serverId}:`, err);
        state$.next({
          status: 'error',
          error: err.message || 'Error de conexión',
          timestamp: Date.now()
        });
        this.cleanup(serverId);
        return EMPTY;
      })
    );

    // Solo aplicar retry si reconnect es true
    if (reconnect) {
      observable$ = observable$.pipe(
        // Reconectar infinitamente cada 3 segundos
        catchError((err) => {
          console.warn(`🔄 [WS] Reconectando ${serverId}...`);
          return timer(3000).pipe(
            tap(() => {
              if (this.connections.has(serverId)) {
                console.log(`🔁 [WS] Reintentando conectar a ${serverId}`);
                this.reconnect(serverId, url, true);
              }
            }),
            // Volver a lanzar el observable de conexión
            switchMap(() => this.connect(serverId, url, true))
          );
        })
      );
    }

    // Compartir la conexión (evita múltiples suscripciones)
    observable$ = observable$.pipe(share());

    return observable$;
  }

  /**
   * Reconecta a un servidor (usado internamente)
   */
  private reconnect(serverId: string, url: string, reconnect: boolean): void {
    this.disconnect(serverId);
    this.connect(serverId, url, reconnect).subscribe();
  }

  /**
   * Envía un mensaje a un servidor
   * @param serverId
   * @param message
   * @returns true si se envió, false si no está conectado
   */
  send(serverId: string, message: any): boolean {
    const subject = this.connections.get(serverId);
    const state = this.states.get(serverId)?.value;

    if (subject && state?.status === 'connected') {
      subject.next(message);
      return true;
    } else {
      console.warn(`⚠️ No se puede enviar a ${serverId}. Estado: ${state?.status}`);
      return false;
    }
  }

  /**
   * Escucha mensajes de un servidor
   * @param serverId
   */
  onMessage(serverId: string): Observable<any> {
    // Si no hay conexión activa, devuelve un observable vacío con error
    if (!this.connections.has(serverId)) {
      return new Observable(subscriber => {
        subscriber.error(new Error(`No hay conexión activa con ${serverId}`));
      });
    }
    return this.connect(serverId, this.getUrl(serverId), false);
  }

  /**
   * Obtiene el estado de conexión de un servidor
   */
  getState(serverId: string): Observable<WebSocketState> {
    if (!this.states.has(serverId)) {
      const initial = new BehaviorSubject<WebSocketState>({
        status: 'disconnected',
        timestamp: Date.now()
      });
      this.states.set(serverId, initial);
    }
    return this.states.get(serverId)!.asObservable();
  }

  /**
   * Desconecta un servidor
   */
  disconnect(serverId: string): void {
    if (this.connections.has(serverId)) {
      const subject = this.connections.get(serverId)!;
      subject.complete(); // Cierra el WebSocket
      this.connections.delete(serverId);
      console.log(`🔌 [WS] Desconectado de ${serverId}`);
    }

    const state = this.states.get(serverId);
    if (state) {
      state.next({
        ...state.value,
        status: 'disconnected'
      });
    }
  }

  /**
   * Desconecta de todos los servidores
   */
  disconnectAll(): void {
    this.connections.forEach((_, serverId) => {
      this.disconnect(serverId);
    });
    console.log('🔌 [WS] Desconectado de todos los servidores');
  }

  /**
   * Verifica si un servidor está conectado
   */
  isConnected(serverId: string): boolean {
    return this.states.get(serverId)?.value.status === 'connected';
  }

  /**
   * Limpia recursos
   */
  private cleanup(serverId: string): void {
    this.connections.delete(serverId);
  }

  /**
   * Obtiene la URL de un servidor (si la necesitas)
   * Nota: WebSocketSubject no expone la URL, así que la puedes guardar si es necesario
   */
  private getUrl(serverId: string): string {
    // Aquí deberías tener un mapa si necesitas recuperar la URL
    // Por ahora, asumimos que la tienes guardada fuera o la pasas nuevamente
    console.warn('getUrl: no se puede obtener la URL del WebSocketSubject directamente');
    return ''; // Debes pasarla desde fuera
  }
}