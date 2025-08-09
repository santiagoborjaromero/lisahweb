import { inject, Injectable } from '@angular/core';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { Observable } from 'rxjs';
import { Sessions } from '../helpers/session.helper';

@Injectable({
  providedIn: 'root'
})
export class SentinelService {
  private readonly sessions = inject(Sessions);

  public ws:any;
  public reconn:any;
  
  constructor() {
  }

  openWS(server:any, reconnect:boolean = true): Observable<any>{
    this.reconn = reconnect;
    const token = this.sessions.get("token");
    let url = `ws://${server.host}:${server.agente_puerto}/ws?token=${token}`;
    this.ws = new WebSocket(url);
    this.ws.onopen = (event:any) => this.onOpenListener(event);
    this.ws.onmessage = (event:any) => this.onMessageListener(event);
    this.ws.onclose = (event:any) => this.onCloseListener(event);
    this.ws.onerror = (event:any) => this.onErrorListener(event);

    return this.ws;
  }

  onOpenListener(event:any){
    if (event.type == 'open') {

    }
  }
  onMessageListener(event:any){
    console.log("onMessageListener", event);
  }
  onCloseListener(event:any){
    console.log("onCloseListener", event);
    if (this.reconn){
      console.log("Reconnect")
    }
  }
  onErrorListener(event:any){
    console.log("onErrorListener", event);
    if (this.reconn){
      console.log("Reconnect")
    }
  }
}