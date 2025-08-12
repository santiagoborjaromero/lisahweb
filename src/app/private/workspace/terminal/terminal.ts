import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Sessions } from '../../../core/helpers/session.helper';
import { Functions } from '../../../core/helpers/functions.helper';
import { ServidorService } from '../../../core/services/servidor.service';
import { WSService } from '../../../core/services/ws.service';
import iconsData from '../../../core/data/icons.data';
import { Workspace } from '../workspace';
import { Global } from '../../../core/config/global.config';
import { GeneralService } from '../../../core/services/general.service';

@Component({
  selector: 'app-terminal',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './terminal.html',
  styleUrl: './terminal.scss'
})
export class Terminal implements OnInit{
  private readonly route = inject(ActivatedRoute);
  private readonly sessions = inject(Sessions);
  private readonly func = inject(Functions);
  private readonly serverSvc = inject(ServidorService);
  private readonly parent = inject(Workspace);
  private readonly generalSvc = inject(GeneralService);

  Title = "Terminal";
  TAB = "terminal"

  user:any | undefined;
  work:any | undefined;
  icono = iconsData;

  global = Global;

  /**
   * Sentinel
  */
  agente_status: string = "Desconectado";
  ssh_status: string = "Desconectado";
  ws: any;
  reconnect: boolean = false;
  light_ws: boolean = false;
  light_ssh: boolean = false;
  metdodo_seleccionado: number = 0;
  lstGrupoUsuarios:any = [];
  ws_error:number = 0;
  ws_error_limit:number = 3;

  constructor(){
    this.parent.findTab(this.TAB);
  }

  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get("user"));
    this.work = JSON.parse(this.sessions.get("work"));
  }

  metodo(metodo:number){
    this.func.showLoading(`Cambiando de Método de Conexión a ${metodo==1 ? 'Sentinel' : 'SSH'}`)
    this.metdodo_seleccionado = metodo;
    if (metodo == 1){
      //METODO SENTINEL
      this.openWS()
      this.ssh_status = "Desconectado";
      this.light_ssh = false;
    }else{
      //METODO SSH
      try{
        this.ws.close(1000);
      }catch(err){}
      this.ws = null
      this.connState();
      this.testSSH();
    }
  }

  /**
   * SSH
   */

  testSSH(){
    let param = { 
      host: this.work.host, 
      puerto: this.work.ssh_puerto 
    }
    this.generalSvc.apiRest("POST", "healthy_server", param).subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        console.log(resp)
        if (resp.status) {
          this.ssh_status = "Conectado";
          this.light_ssh = true;
        } else {
          this.ssh_status = "Desconectado";
          this.light_ssh = false;
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
        this.func.handleErrors("TestSSH", err);
      },
    });
  }


  /**
   * Sentinel
   */

  openWS() {
    this.agente_status = "Conectando ...";
    const token = this.sessions.get('token');
    let url = `ws://${this.work.host}:${this.work.agente_puerto}/ws?token=${token}`;
    try{
      this.ws = new WebSocket(url);
      this.ws.onopen = (event: any) => this.onOpenListener(event);
      this.ws.onmessage = (event: any) => this.onMessageListener(event);
      this.ws.onclose = (event: any) => this.onCloseListener(event);
      this.ws.onerror = (event: any) => this.onErrorListener(event);
    }catch(ex){}
  }

  onOpenListener(event: any) {
    this.connState();
    this.func.closeSwal();
    if (event.type == 'open') {
      console.log(`√ Conectado ${this.work.idservidor}`);
      this.agente_status = "Conectado";
      this.work.healthy_agente = 'OK|Conectado';
    } else {
      this.agente_status = "No se estableció conexion con Sentinel";
      console.log(`X Desconectado ${this.work.idservidor}`);
      this.work.agente_status = 'FAIL|Desconectado';
    }
  }

  onCloseListener(event: any) {
    // console.log('onCloseListener', event);
    console.log("█ Desconectado")
    console.log(`X Desconectado ${this.work.idservidor}`);
    if (event.code == 1000){
      this.agente_status = "Desconectado";
      this.ws_error = 0;
    }else{
      this.work.healthy_agente = 'FAIL|Desconectado';
      this.agente_status = "Desconectado";
    }
  }

  onErrorListener(event: any) {}

  onMessageListener(e:any){
    console.log(`↓ LlegoMensaje ${this.work.idservidor}`);
    let data = JSON.parse(e.data);
    console.log(data)
    this.func.closeSwal()
  }


  connState = () => {
    let m = false;

    if (this.ws === undefined){
       m = false;
    }else{
      try{
        switch (this.ws.readyState){
          case 0:
            //m = "Pepper has been created. The connection is not yet open.";
            m = false;
            break;
          case 1:
            //m = "The connection is open and ready to communicate.";
            m = true;
            break;
          case 2:
            //m = "The connection is in the process of closing.";
            m = false;
            break;
          case 3:
            //m = "The connection is closed or couldn't be opened.";
            m = false;
            break;
        }
      }catch(err){
        m = false;
      }
    }

    this.light_ws = m;
    return m;
  }


}
