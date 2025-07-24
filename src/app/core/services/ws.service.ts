// websocket-manager.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

export interface ServerConfig {
  id: string;           // Identificador único (puede ser IP, nombre, etc.)
  url: string;          // URL completa del WebSocket (ej: ws://ip:port)
  options?: any;        // Opcional: headers, protocols, etc.
}

export interface WsMessage {
  action: string;
  [key: string]: any;  // Permite otros campos
}

export interface WsResponse {
  action: string;
  data: any;
  serverId: string;
  timestamp: number;
  error?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WSService {
  private connections = new Map<string, WebSocket>();
  private messageSubjects = new Map<string, Subject<WsResponse>>();
  private connectionStatus = new Map<string, BehaviorSubject<boolean>>();

  // Emite cuando llega cualquier mensaje de cualquier servidor
  public readonly onAnyMessage: BehaviorSubject<WsResponse | null> = new BehaviorSubject<WsResponse | null>(null);

  constructor() {}

  /**
   * Conecta a un servidor
   */
  connect(server: any): Observable<any> {
    const id = server.idservidor;
    const url = `ws://${server.host}:${server.agente_puerto}`;

    if (this.connections.has(id)) {
      // console.warn(`Ya existe una conexión activa con el servidor: ${id}`);
      return this.connectionStatus.get(id)!.asObservable();
    }

    const subject = new Subject<WsResponse>();
    const status = new BehaviorSubject<boolean>(false);
    this.messageSubjects.set(id, subject);
    this.connectionStatus.set(id, status);

    const ws = new WebSocket(url);

    ws.onopen = () => {
      // console.log(`[WS] Conectado a ${id} (${url})`);
      server.healthy_agente = "OK|Conectado";
      status.next(server);
    };

    ws.onmessage = (event) => {
      try {
        const data: WsMessage = JSON.parse(event.data);
        const response: WsResponse = {
          action: data.action,
          data: data,
          serverId: id,
          timestamp: Date.now()
        };
        subject.next(response);
        this.onAnyMessage.next(response); // Broadcast global
      } catch (err) {
        console.error(`[WS] Error procesando mensaje de ${id}:`, err);
        const errorResponse: WsResponse = {
          action: 'error',
          data: { original: event.data, error: 'Invalid JSON' },
          serverId: id,
          timestamp: Date.now(),
          error: true
        };
        subject.next(errorResponse);
        this.onAnyMessage.next(errorResponse);
      }
    };

    ws.onclose = (event) => {
      // console.log(`[WS] Conexión cerrada con ${id}`, event);
 
      // this.reconnect(server); // Reintento automático
    };

    ws.onerror = (err) => {
      // console.error(`[WS] Error con ${id}`, err);
      // status.next(false);
      server.healthy_agente = "FAIL|Desconectado|"+id;
      status.next(server);
    };

    this.connections.set(id, ws);

    return status.asObservable();
  }

  /**
   * Desconecta de un servidor
   */
  disconnect(serverId: string): void {
    const ws = this.connections.get(serverId);
    if (ws) {
      ws.close();
      this.connections.delete(serverId);
      this.messageSubjects.get(serverId)?.complete();
      this.messageSubjects.delete(serverId);
      this.connectionStatus.get(serverId)?.complete();
      this.connectionStatus.delete(serverId);
      console.log(`[WS] Desconectado de ${serverId}`);
    }
  }

  /**
   * Envía un mensaje a un servidor
   */
  send(serverId: string, message: WsMessage): void {
    const ws = this.connections.get(serverId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.warn(`[WS] No se puede enviar a ${serverId}: conexión no abierta`);
    }
  }

  /**
   * Escucha mensajes de un servidor específico filtrados por acción
   */
  onMessage(serverId: string, action?: string): Observable<any> {
    const subject = this.messageSubjects.get(serverId);
    if (!subject) {
      console.warn(`[WS] No hay conexión con ${serverId}`);
      return new Observable();
    }

    return action
      ? new Observable<any>(obs => {
          const subscription = subject.subscribe(msg => {
            if (msg.action === action) obs.next(msg);
          });
          return () => subscription.unsubscribe();
        })
      : subject.asObservable();
  }

  /**
   * Escucha cualquier mensaje de cualquier servidor
   */
  onAnyMessage$(): Observable<WsResponse | null> {
    return this.onAnyMessage.asObservable();
  }

  /**
   * Obtiene el estado de conexión de un servidor
   */
  isConnected(serverId: string): boolean {
    return this.connectionStatus.get(serverId)?.value === true;
  }

  /**
   * Reintento con backoff exponencial
   */
  private reconnect(server: ServerConfig, delay: number = 1000, maxDelay = 30000): void {
    setTimeout(() => {
      const status = this.connectionStatus.get(server.id);
      if (!status || !status.value) {
        console.log(`[WS] Reintentando conexión con ${server.id}...`);
        this.connect(server);
      }
    }, delay);
  }

  /**
   * Cierra todas las conexiones
   */
  disconnectAll(): void {
    Array.from(this.connections.keys()).forEach(id => this.disconnect(id));
  }

  /**
   * Envía un comando y espera una respuesta única (con timeout)
   */
  sendCommand(serverId: string, message: WsMessage, timeoutMs: number = 10000): Promise<WsResponse> {
    return new Promise((resolve, reject) => {
      const subscription = this.onMessage(serverId, message.action).subscribe(response => {
        subscription.unsubscribe();
        resolve(response);
      });

      // Timeout
      setTimeout(() => {
        subscription.unsubscribe();
        reject(new Error(`Timeout enviando '${message.action}' a ${serverId}`));
      }, timeoutMs);

      this.send(serverId, message);
    });
  }
}