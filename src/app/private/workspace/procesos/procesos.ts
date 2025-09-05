import { Component, inject, OnInit, Sanitizer } from '@angular/core';
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
import {
  AllCommunityModule,
  createGrid,
  GridApi,
  GridOptions,
  ICellRendererParams,
  ModuleRegistry,
} from 'ag-grid-community';
import { UsuarioService } from '../../../core/services/usuarios.service';
import { ConfigService } from '../../../core/services/config.service';
import { ScriptsService } from '../../../core/services/script.service';
import { DomSanitizer } from '@angular/platform-browser';
import Swal from 'sweetalert2';
import { Encryption } from '../../../core/helpers/encryption.helper';


@Component({
  selector: 'app-procesos',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './procesos.html',
  styleUrl: './procesos.scss'
})
export class Procesos {
  private readonly sessions = inject(Sessions);
  private readonly parent = inject(Workspace);
  private readonly func = inject(Functions);
  private readonly serverSvc = inject(ServidorService);
  private readonly cfgSvc = inject(ConfigService);
  private readonly scriptSvc = inject(ScriptsService);
  private readonly userSvc = inject(UsuarioService);
  private readonly agente = inject(WSService);
  private readonly encrypt = inject(Encryption);

  Title = 'Procesos';
  TAB = 'procesos';
  areas = ["procesos"];

  user: any | undefined;
  work: any | undefined;
  icono = iconsData;

  rstScriptCreacionUsuario: any = null;
  global = Global;
  lstUsuarios: Array<any> = [];
  lstComandos: Array<any> = [];
  lstLogs: Array<any> = [];
  noti: any = null;

  lstProcesos: Array<any> = [];

/**
   * Sentinel
  */
  agente_status: string = "Desconectado";
  ws: any;
  reconnect: boolean = true;
  light_ws: boolean = false;
  ws_error:number = 0;
  ws_error_limit:number = 3;

  constructor(){
    this.parent.findTab(this.TAB);    

  }

  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get('user'));
    this.work = JSON.parse(this.sessions.get('work'));
    this.initial();
  }
  
  
  initial(){
    this.getDataUsuarios();
    if (!this.connState()){
      this.openWS();
    }
  }

  getDataUsuarios() {
    this.lstUsuarios = [];
    this.func.showLoading('Cargando');

    this.serverSvc.getOneWithUsers(this.work.idservidor).subscribe({
      next: (resp: any) => {
        // console.log("RESP USUARIOS ", resp)
        this.func.closeSwal();
        if (resp.status) {
          if (resp.data[0].usuarios.length > 0){
            resp.data[0].usuarios.forEach((e:any)=>{
              e["servidor"] = null;
              if (e.idgrupo_usuario){
                this.lstUsuarios.push(e)
              }
            })
          }
          if (resp.data[0].comandos.length > 0){
            this.lstComandos = [];
            resp.data[0].comandos.forEach( (c:any)=>{
              if (this.areas.includes(c.area)){
                this.lstComandos.push(c)
              }
            })
          }
          // this.rstScriptCreacionUsuario = resp.data[0].cliente.configuracion.script.cmds;
          // console.log(this.lstComandos)
          // this.ejecutaOperaciones([{accion:"listar", usuario: ""}]);
        } else {
          this.func.handleErrors("Server", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
      },
    });
  }

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
    let status = '';
    this.connState();
    if (event.type == 'open') {
      console.log(`√ Conectado ${this.work.idservidor}`);
      this.agente_status = "Conectado";
      this.work.healthy_agente = 'OK|Conectado';

      // this.onSendCommands();
      // this.startMonitor();
    } else {
      this.agente_status = "No se estableció conexion con Sentinel";
      console.log(`X Desconectado ${this.work.idservidor}`);
      this.work.agente_status = 'FAIL|Desconectado';
      
    }
  }

  onCloseListener(event: any) {
    // console.log('onCloseListener', event);
    this.connState();
    console.log("█ Desconectado")
    console.log(`X Desconectado ${this.work.idservidor}`);
    if (event.code == 1000){
      this.agente_status = "Desconectado manualmente";
      this.ws_error = 0;
    }else{
      this.work.healthy_agente = 'FAIL|Desconectado';
      this.agente_status = "Desconectado";
      if (this.reconnect && this.ws_error < this.ws_error_limit){
        this.ws_error ++;
        // setTimeout(()=>{
        //   this.traerListaDeServicios();
        // },1000)
      }
    }
  }

  onErrorListener(event: any) {}

  onMessageListener(e: any) {
    this.func.closeSwal();
    console.log(`↓ LlegoMensaje ${this.work.idservidor}`);
    let data = JSON.parse(e.data);
    console.log(data)
    // let status = data.status;
    let status = true;
    let r = "";
    let acum:any ;
    let rd:any;
    let aux:any | undefined;
    let paux:any | undefined;
    let daux:any | undefined;
    data.data.forEach((d:any)=>{
      this.lstLogs.push({
        id: d.id,
        cmd: atob(d.cmd),
        respuesta: atob(d.respuesta),
        status: status
      });
    //   switch(d.id){
    //     // case `${this.area}|listar_todo`:
    //     case "servicios":
    //       break;
    //     default:
    //       this.func.closeSwal();
    //       break;
    //   }
    })
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

    onSendCommands(params:any=null){
    this.func.showLoading("Cargando",10);
    if (this.connState()){
      console.log("↑ Enviando");
      console.log(params);
      this.ws.send(JSON.stringify(params));
    }
  }

  ejecutar(idcomando:any){
    let obj:any = null;
    this.lstComandos.forEach(c=>{
      if (c.idcomando == idcomando){
        obj = c
      }
    })

    if (obj){
      console.log(obj)
      let cmd = {id: obj.accion, cmd: obj.comando, respuesta:"", status:true};
      let params = {
        action: "comando",
        identificador: {
          idcliente: this.user.idcliente,
          idusuario: this.user.idusuario,
          idservidor: this.work.idservidor,
          usuario: this.user.usuario,
          id: Math.floor(Math.random() * (9999999999999999 - 1000000000000000 + 1)) + 1000000000000000
        },
        data: [cmd]
      };
      this.lstLogs.push(cmd)
      this.onSendCommands(params);
    }
  }
}
