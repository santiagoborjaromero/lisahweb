// websocket-manager.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ServerStatus {
  idservidor: number;
  healthy_agente: '1' | '0' | '-';
  uptime: string;
  cpu: string;
  memoria: string;
  disco: string;
  servicio_httpd: string;
  servicio_ssh: string;
}

type ValidStatId = 'disco' | 'cpu' | 'memoria' | 'servicio_httpd' | 'servicio_ssh' | 'uptime';

function isValidStatId(id: string): id is ValidStatId {
  return ['disco', 'cpu', 'memoria', 'servicio_httpd', 'servicio_ssh', 'uptime'].includes(id);
}

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private webSockets = new Map<number, WebSocket>();
  private serverStatusSubject = new BehaviorSubject<Map<number, ServerStatus>>(new Map());
  public serverStatus$ = this.serverStatusSubject.asObservable();

  private initialStatus: ServerStatus = {
    idservidor: 0,
    healthy_agente: '-',
    uptime: '-',
    cpu: '-',
    memoria: '-',
    disco: '-',
    servicio_httpd: '-',
    servicio_ssh: '-',
  };

  // Inicializa el estado de todos los servidores
  initializeServers(servers: any[]): void {
    console.log(servers)
    const statusMap = new Map<number, ServerStatus>();

    servers.forEach((server) => {
      console.log(server)
      statusMap.set(server.idservidor, {
        ...this.initialStatus,
        idservidor: server.idservidor,
        healthy_agente: '0', // desconectado por defecto
      });
    });

    this.serverStatusSubject.next(statusMap);
  }

  connectToServer(server: any): void {
    const url = `ws://${server.host}:${server.agente_puerto}`;
    const ws = new WebSocket(url);

    this.webSockets.set(server.idservidor, ws);

    ws.onopen = () => {
      console.log(
        `✅ Conectado: ${server.nombre} (ID: ${server.idservidor})`
      );
      this.updateServerStatus(server.idservidor, { healthy_agente: '1' });
      // this.sendMessage(server.idservidor,({
      //   action: "stats",
      //   identificador: "3hhsy3788sjakjaksend",
      //   referencia: server.nombre
      // }))
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.action === 'stats') {
          const updates: Partial<ServerStatus> = {};

          msg.data.forEach((item: any) => {
            const out = item.respuesta.stdout.trim();
            const code = item.respuesta.returncode;

            if (!isValidStatId(item.id)) {
                return; // Ignora IDs desconocidos
            }

            if (code !== 0) {
              // Si el comando falló
            //   updates[item.id] = 'error';
              return;
            }

            // Procesar cada tipo de dato
            switch (item.id) {
              case 'disco':
                // Ej: "1007G 20G 937G" → queremos el espacio libre: último valor
                const parts = out.split(/\s+/).filter(Boolean);
                updates.disco = parts.length >= 3 ? parts[2] + ' libre' : out;
                break;

              case 'cpu':
                // Carga promedio: toma el primer valor (1 min)
                const cpuMatch = out.match(/(\d+\.\d+)/);
                updates.cpu = cpuMatch ? `${cpuMatch[0]}%` : 'unknown';
                break;

              case 'memoria':
                // Aquí el ejemplo que diste no es claro, pero supongamos que hay que mejorar el script.
                // Por ahora, guardamos el bruto o puedes pedirle al agente que lo envíe mejor.
                updates.memoria = out || 'unknown';
                break;

              case 'servicio_httpd':
                updates.servicio_httpd = out.includes('active')
                  ? 'activo'
                  : 'inactivo';
                break;

              case 'servicio_ssh':
                updates.servicio_ssh = out.includes('active')
                  ? 'activo'
                  : 'inactivo';
                break;

              default:
                break;
            }
          });

          // Actualiza el estado del servidor
          this.updateServerStatus(server.idservidor, updates);
        }
      } catch (e) {
        console.error(
          `Error procesando mensaje del servidor ${server.idservidor}`,
          e
        );
      }
    };

    ws.onerror = (error) => {
      console.error(`❌ Error en WebSocket (${server.idservidor})`, error);
    };

    ws.onclose = () => {
      console.log(`🔌 Desconectado del agente: ${server.idservidor}`);
      this.updateServerStatus(server.idservidor, { healthy_agente: '0' });
      this.webSockets.delete(server.idservidor);
    };
  }

  private updateServerStatus(id: number, updates: Partial<ServerStatus>): void {
    const current = this.serverStatusSubject.value;
    const server = current.get(id);

    if (server) {
      current.set(id, { ...server, ...updates });
    } else {
      current.set(id, {
        ...this.initialStatus,
        idservidor: id,
        ...updates,
      } as ServerStatus);
    }

    this.serverStatusSubject.next(new Map(current));
  }

  // Para obtener el estado actual de un servidor
  getServerStatus(id: number): ServerStatus | undefined {
    return this.serverStatusSubject.value.get(id);
  }

  // Enviar comandos al agente si necesitas
  sendMessage(id: number, message: any): void {
    const ws = this.webSockets.get(id);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  disconnectAll(): void {
    this.webSockets.forEach((ws) => ws.close());
    this.webSockets.clear();
  }
}
