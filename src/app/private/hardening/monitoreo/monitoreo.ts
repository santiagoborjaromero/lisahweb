import { Component, ElementRef, inject, Input } from '@angular/core';
import { ScriptsService } from '../../../core/services/script';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-monitoreo',
  imports: [],
  templateUrl: './monitoreo.html',
  styleUrl: './monitoreo.scss'
})
export class Monitoreo {
  @Input() servidor?: any

  private readonly scriptSvc = inject(ScriptsService);
  private readonly sanitizer = inject(DomSanitizer);

  lstServicios: any = [];
  wsConn: any | undefined;

  ngOnInit(): void {
    console.log(this.servidor)  ;
  }
  
  ngAfterViewInit(): void {
    this.getMonitoreo();
    
  }
  
  getMonitoreo(){
    this.lstServicios = [];
    this.scriptSvc.getOne(this.servidor.idscript_monitoreo).subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.lstServicios.push({
              linea_comando: "Agente",
              respuesta: ""
            });
          resp.data[0].cmds.forEach((e:any) => {
            e.respuesta = ""
            this.lstServicios.push(e);
          });
          this.goCheck();
        } else {
        }
        console.log("Servicios", this.lstServicios)
      },
      error: (err: any) => {
      },
    });
  }


  async goCheck(){
    console.log("Conectando ....")
    let ws = `ws://${this.servidor.host}:${this.servidor.agente_puerto}`;
    let wsConn:any = new WebSocket(ws);
    wsConn.onopen = (event:any) => this.onOpenListenerONE(wsConn, event);
    wsConn.onmessage = (event:any) => this.onMessageListenerONE(wsConn, event);
  } 

  onOpenListenerONE(socket:any, event:any){
    console.log("[√] Conectado")
    
    let textSend = "";
    let compendio:any = [];
    this.lstServicios.forEach((s:any, idx:any)=>{
      if (idx == 0){
        this.encontrarRow([
          {cmd: s.linea_comando, respuesta: `<span class="text-success"><i class="far fa-check-circle t12"></i> Conectado</span>`}
        ]);
      }else{
        compendio.push({
          id: s.idtemplate_comando,
          cmd: s.linea_comando
        })
      }
    });
    textSend = JSON.stringify({
      action: "comando",
      identificador: "3hhsy3788sjakjaksend",
      data: compendio
    });
    console.log("Envio", textSend)
    socket.send(textSend)
  }

  onMessageListenerONE(socket:any, event:any){
    console.log("█ Entrada ", event.data)
    let data = JSON.parse(event.data);
    this.encontrarRow(data.data)
  }

  encontrarRow(record:any){
    record.forEach((r:any)=>{
      this.lstServicios.forEach((s:any) => {
        if (s.linea_comando == r.cmd ){
          s.respuesta = r.respuesta;
        }
      });
    })            
  }

  async oneWSConn(socket: any, timeout = 3000) {
    const isOpened = () => socket.readyState === WebSocket.OPEN;
    if (socket.readyState !== WebSocket.CONNECTING) {
      return isOpened();
    } else {
      const intrasleep = 100;
      const ttl = timeout / intrasleep; 
      let loop = 0;
      while (socket.readyState === WebSocket.CONNECTING && loop < ttl) {
        await new Promise((resolve) => setTimeout(resolve, intrasleep));
        loop++;
      }
      return isOpened();
    }
  }


  /** Conexion Estable */

  async connectWS(host="", puerto="") {
    console.log(`Conectando ${host}:${puerto}`);
    this.wsConn = new WebSocket(`ws://${host}:${puerto}`);
    this.wsConn.onopen = (event:any) => this.onOpenListener(event);
    this.wsConn.onmessage = (event:any) => this.onMessageListener(event);
    this.wsConn.onclose = (event:any) => this.onCloseListener(event);
    this.wsConn.onerror = (event:any) => this.onErrorListener(event);
  }

  onOpenListener = (event:any) => {
    console.log(event.returnValue)
    // const isOpened = () => socket.readyState === WebSocket.OPEN
  }

  onMessageListener = (event:any) => {
    console.log(this.onOpenListener)
  }
  onCloseListener = (event:any) => {

  } 
  onErrorListener = (event:any) => {

  }

}
