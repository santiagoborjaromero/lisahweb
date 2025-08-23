import { Component, ElementRef, inject, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Sessions } from '../../../core/helpers/session.helper';
import { Functions } from '../../../core/helpers/functions.helper';
import { ServidorService } from '../../../core/services/servidor.service';
import iconsData from '../../../core/data/icons.data';
import { Workspace } from '../workspace';
import { Global } from '../../../core/config/global.config';
import { GeneralService } from '../../../core/services/general.service';
import moment from 'moment';
// import { Terminal } from 'xterm';
// import { FitAddon } from 'xterm-addon-fit';


@Component({
  selector: 'app-terminal',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './terminal.html',
  styleUrl: './terminal.scss',
  standalone: true
})
export class Terminals implements OnInit{
  @ViewChild('terminal', { static: false }) public terminal!: ElementRef;
  @ViewChild('divterminal', { static: false }) public divterminal!: ElementRef;
  private readonly route = inject(ActivatedRoute);
  private readonly sessions = inject(Sessions);
  private readonly func = inject(Functions);
  private readonly serverSvc = inject(ServidorService);
  private readonly parent = inject(Workspace);
  private readonly generalSvc = inject(GeneralService);
  private readonly viewportScroller = inject(ViewportScroller);
  
  Title = "Envio de Comandos";
  TAB = "terminal"
  tab = 1

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
  metodo_seleccionado: number = 2;  //1 Websocket - 2 SSH
  lstGrupoUsuarios:any = [];
  ws_error:number = 0;
  ws_error_limit:number = 3;

  
  lstPendientes: Array<any> = [];
  lstServidores: Array<any> = [];
  lstServidores_Original: Array<any> = [];
  idservidor:string = "";
  idscript:string = "";

  oBuscarHistorico:string = "";
  oBuscarComandos:string = "";
  oBuscarScripts:string = "";
  
  /**
   * Terminal
   */
  lstHistory:Array<any> = [];
  lstHistory_Complete:Array<any> = [];
  
  lstHistoryCmds:Array<any> = [];
  lstComandos: Array<any> = [];
  lstScripts: Array<any> = [];

  lstHistoryCmds_O:Array<any> = [];
  lstComandos_O: Array<any> = [];
  lstScripts_O: Array<any> = [];

  texto:string = "";
  prompt: string = "";
  firstTime: boolean = true; 
  procesando: boolean = false; 

  whoami: string = "";
  pwd: string = "";
  webssh2: any;
  
  cmdTexto: string = "";


  constructor(){
    this.parent.findTab(this.TAB);
  }

  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get("user"));
    this.work = JSON.parse(this.sessions.get("work"));
    setTimeout(()=>{
      this.initial();
    },800)
    this.lstHistoryCmds = [];
    this.getUsuario();
    this.getScripts();
    this.getComandos();
  }
  
  initial(){
    this.lstHistory.push(
      {texto: "********************************************************************", clase:"text-green"},
      {texto: "Bienvenido! a LiSAH Terminal - envio de comandos en bloque", clase:"text-green"},
      {texto: "********************************************************************", clase:"text-green"},
      {texto: "El proceso de envio se ejecutará con los permisos asignados de su usuario en el servidor, asegurese de terner los permisos necesarios para ejecutar comandos.", clase:"text-white"},
      {texto: "Seleccione los comandos deseados y el orden de ejecución, luego podrá ejecutar con el botón enviar.", clase:"text-red"},
      {texto: moment().format("YYYY-MM-DD HH:mm:ss"), clase:"text-yellow"},
      // {texto: "Seleccione medio de comunicacion", clase:"text-white"},
      // {texto: `1) Conexión vía LiSAH - Sentinel, ${this.work.host}:${this.work.agente_puerto}`, clase:"text-white"},
      // {texto: `2) Conexión vía SSH, ${this.work.host}:${this.work.ssh_puerto}`, clase:"text-white"},
    )
    // this.prompt = this.user.usuario + ">";
    // // setTimeout(()=>{
    // //   this.terminal.nativeElement.focus();
    // // },500)
    // this.firstTime = true;
    this.ir();
  }

  getUsuario() {
    this.lstServidores = [];
    this.generalSvc.apiRest("GET", `usuarios/${this.user.idusuario}`).subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        if (resp.status) {
          if (resp.data[0].servidores && resp.data[0].servidores.length > 0) {
            resp.data[0].servidores.forEach((s:any)=>{
              this.lstServidores.push(s)
            })
          }

          this.lstServidores_Original = Array.from(this.lstServidores);
        } else {
          this.func.handleErrors("Hardening", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
        this.func.handleErrors("Hardening", err);
      },
    });
  }

  getScripts(){
    this.generalSvc.apiRest("GET", "scripts").subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.lstScripts_O = resp.data;
          this.lstScripts = resp.data;
        } else {
          this.func.showMessage("error", "Scripts", resp.message);
        }
      },
      error: (err: any) => {
        this.func.handleErrors("Scripts", err);
      },
    });
  }

  getComandos(){
    this.generalSvc.apiRest("GET", "templates").subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.lstComandos = resp.data;
          this.lstComandos_O = resp.data;
        } else {
          this.func.handleErrors("Comandos", resp.message);
        }
      },
      error: (err: any) => {
        this.func.handleErrors("Comandos", err);
      },
    });
  }

  historicoCmds(cmd:string = ""){
    let found = false;
    this.lstHistoryCmds.forEach((e:any)=>{
        if (e == cmd){
          found = true
        }
    });
    if (!found){
      this.lstHistoryCmds.push(cmd);
    }
  }

  historico(texto:any){
    this.lstHistory.push(
      {texto: texto, clase:"text-white"},
    )
    this.gotoBottom();
    if (!this.procesando){
      setTimeout(()=>{
        try{
          this.terminal.nativeElement.focus();
        }catch(ex){}
      },800)
    }
  }

  clear(){
    this.lstHistory_Complete =  this.lstHistory_Complete.concat(this.lstHistory);
    this.lstHistory = [];
  } 

  onSendCommands(cmd_array:any=[]){
    this.procesando = true;
    let cmds:Array<any> = [];
    cmd_array.forEach((c:any) => {
      cmds.push({id: "terminal", cmd: c})
    });

    let params = {
      action: "comando",
      identificador: {
        idcliente: this.user.idcliente,
        idusuario: this.user.idusuario,
        idservidor: this.work.idservidor,
        usuario: this.user.usuario,
        id: Math.floor(Math.random() * (9999999999999999 - 1000000000000000 + 1)) + 1000000000000000
      },
      data: cmds
    };

    if (this.metodo_seleccionado==1){
      if (this.connState()){
        console.log("↑ Enviando")
        this.ws.send(JSON.stringify(params));
      }else{
        this.openWS();
        setTimeout(()=>{
          this.onSendCommands(cmd_array);
        },1000)
      }
    } else{
      this.sendSSH(params);
    }
  }

  /**
   * SSH
   */

  sendSSH(param:any){
    // this.generalSvc.apiRest("POST", "healthy_server", param).subscribe({
    param["host"] = this.work.host;
    param["puerto"] = this.work.ssh_puerto;
    this.generalSvc.apiRest("POST", "cmds", param).subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        console.log("↓↓↓↓", resp.data)
        if (resp.status) {
          this.onMessageListener(resp);
        //   this.ssh_status = "Conexión establecida";
        //   this.light_ssh = true;
        //   this.historico("Conexión establecida")

        } else {
          // this.ssh_status = "No se pudo realizar conexión";
          // this.light_ssh = false;
          this.historico(resp.message)
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
      this.historico("Conexión establecida")
      this.onSendCommands(["pwd", "whoami"]);
    } else {
      this.agente_status = "No se estableció conexion con Sentinel";
      console.log(`X No se pudo conectar con servidor ${this.work.nombre}`);
      this.work.agente_status = 'FAIL|Desconectado';
      this.historico("Desconectado")
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
    let data = e.data;
    try{
      data = JSON.parse(e.data);
    }catch(err){
      data = e.data;
    }

    console.log("↓→", data)
    this.procesando = false;
    data.data.forEach((cmd:any) => {
      let resp = atob(cmd.respuesta);
      let command = atob(cmd.cmd);
      switch(command){
        case "pwd":
          this.pwd = resp.replace(/\n/g, '');
          this.actualizaPrompt();
          // this.prompt = `[${this.work.nombre}@${resp.replace(/\n/g, '')}]$ `;
          break;
        case "whoami":
          this.whoami = resp.replace(/\n/g, '');
          this.actualizaPrompt();
          // this.prompt = `[${this.work.nombre}@${resp.replace(/\n/g, '')}]$ `;
          break;
        default:
          // this.historico(resp);
          this.lstHistory.push(
            {texto: "$ " + command, clase:"text-yellow"},
            {texto: resp, clase:"text-white"},
          )
          this.gotoBottom();
          break;
      }
      setTimeout(()=>{
        this.lstPendientes = [];
      },300)
    });
    
  }

  actualizaPrompt(){
     this.prompt = `[${this.whoami}@${this.pwd}]$`;
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


  public ir(): void { 
    this.viewportScroller.scrollToAnchor("fin");
  }

  gotoBottom = () => {
    setTimeout(() => {
      this.divterminal.nativeElement.scrollTop = this.divterminal.nativeElement.scrollHeight;
    }, 300);
  };


  cambiarTab(tab=0){
    this.tab = tab;
  }

  funcBack(){
    this.func.irRuta(`admin/hardening`);
  }

  buscarComandos(event:any) {
    this.lstComandos = [];
    if (this.oBuscarComandos == '') {
      this.lstComandos = Array.from(this.lstComandos_O);
    } else {
      this.lstComandos_O.forEach((e) => {
        if (e.linea_comando.toLowerCase().indexOf(this.oBuscarComandos.toLowerCase()) > -1 ) {
          this.lstComandos.push(e);
        }
      });
    }
  }

  buscarScripts(event:any) {
    this.lstScripts = [];
    if (this.oBuscarScripts == '') {
      this.lstScripts = Array.from(this.lstScripts_O);
    } else {
      this.lstScripts_O.forEach((e) => {
        if (e.nombre.toLowerCase().indexOf(this.oBuscarScripts.toLowerCase()) > -1 ) {
          this.lstScripts.push(e);
        }
      });
    }
  }

  buscarHistorico(event:any) {
    this.lstHistoryCmds = [];
    if (this.oBuscarHistorico == '') {
      this.lstHistoryCmds = Array.from(this.lstHistoryCmds_O);
    } else {
      this.lstHistoryCmds_O.forEach((e) => {
        if (e.toLowerCase().indexOf(this.oBuscarHistorico.toLowerCase()) > -1 ) {
          this.lstHistoryCmds.push(e);
        }
      });
    }
  }

  copia(item:string){
    this.texto = item;
    // this.terminal.nativeElement.focus();
  }

  insertar(cmd:any = ""){
    // this.buscarHistorico(cmd)
    // this.terminal.nativeElement.focus();
    this.lstPendientes.push(cmd)
  }

  insertarScript(idscript:any){
    let cmds:any = [];
    this.lstScripts_O.forEach((e) => {
      if (e.idscript == idscript) {
        cmds = e.cmds
      }
    });

    if (cmds.length>0){
      cmds.forEach((c:any)=>{
        this.historico(c.linea_comando);
      })
    }
  }

  subir(indice:number = 0){
    if (indice == 0){ return }
    let uno = this.lstPendientes[indice];
    let dos = this.lstPendientes[indice - 1];
    this.lstPendientes[indice] = dos;
    this.lstPendientes[indice-1] =  uno;

  }
  bajar(indice:number = 0){
    if (indice == this.lstPendientes.length-1){ return }
    let uno = this.lstPendientes[indice];
    let dos = this.lstPendientes[indice + 1];
    this.lstPendientes[indice] = dos;
    this.lstPendientes[indice + 1] =  uno;
  }
  elimina(indice:number = 0){
    this.lstPendientes.splice(indice,1);
  }

  enviarComandos(){
    this.onSendCommands(this.lstPendientes);
   
  }

  insertarComando(event:any){
    if (event.keyCode == 13){
      this.insertar(this.cmdTexto);
      this.cmdTexto = "";
    }
  }


}
