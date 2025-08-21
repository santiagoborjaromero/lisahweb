import { Component, ElementRef, inject, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Sessions } from '../../core/helpers/session.helper';
import { Functions } from '../../core/helpers/functions.helper';
import { ServidorService } from '../../core/services/servidor.service';
import iconsData from '../../core/data/icons.data';
import { Global } from '../../core/config/global.config';
import { GeneralService } from '../../core/services/general.service';
import moment from 'moment';
import { Titulo } from '../shared/titulo/titulo';
import { Path } from '../shared/path/path';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { MongoService } from '../../core/services/mongo.service';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-terminalssh',
  imports: [Titulo, Path, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './terminalssh.html',
  styleUrl: './terminalssh.scss',
  standalone: true,
})
export class Terminalssh {
  @ViewChild('terminal', { static: false }) public terminal!: ElementRef;
  @ViewChild('divterminal', { static: false }) public divterminal!: ElementRef;

  private readonly route = inject(ActivatedRoute);
  private readonly sessions = inject(Sessions);
  private readonly func = inject(Functions);
  private readonly serverSvc = inject(ServidorService);
  private readonly generalSvc = inject(GeneralService);
  private readonly viewportScroller = inject(ViewportScroller);
  private readonly mongoSvc = inject(MongoService);

  aqui: any | undefined;

  // private webSockets = new Map<number, WebSocket>();
  private server = new Map<number, any>();

  user:any | undefined;
  work:any | undefined;
  icono = iconsData;
  global = Global;
  path:any = [];
  titulo:any = {icono: "",nombre:""}
  canR: boolean = true;
  canW: boolean = true;
  canD: boolean = true;

  tab: number = 0;

  lstServidores: Array<any> = [];
  lstServidores_Original: Array<any> = [];
  idservidor:string = "";
  idscript:string = "";

  oBuscarHistorico:string = "";
  oBuscarComandos:string = "";
  oBuscarScripts:string = "";

  /**
   * Sentinel
  */
  agente_status: string = "Desconectado";
  ssh_status: string = "Desconectado";
  ws: any;
  reconnect: boolean = false;
  light_ws: boolean = false;
  light_ssh: boolean = false;
  metodo_seleccionado: number = 0;
  lstGrupoUsuarios:any = [];
  ws_error:number = 0;
  ws_error_limit:number = 3;

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

  constructor() {
  }


  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get('user'));
    this.work = JSON.parse(this.sessions.get("work"));
    this.path = [
      {nombre: "Admin & Hardening", ruta: ""}, 
      {nombre: "Hardening Servidores", ruta: "admin/hardening"}, 
      {nombre: "Terminal", ruta: ""}, 
    ];
  
    this.titulo = {icono: "fas fa-terminal",nombre: `Terminal ${this.work.nombre}`}

    if (this.user.idrol > 1) {
      let scope = this.user.roles.permisos_crud.split('');
      this.canR = scope[0] == 'R' ? true : false;
      this.canW = scope[1] == 'W' ? true : false;
      this.canD = scope[2] == 'D' ? true : false;

      if (!this.canR) {
        this.func.showMessage(
          'info',
          'Usuarios',
          'No tiene permisos para leer'
        );
      }
    }
    this.getUsuario();
    // this.getScripts();
    this.getComandos();
    this.initial();
  }

  cambiarTab(tab=0){
    this.tab = tab;
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
              this.server.set(s.idservidor, s);
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

  // getScripts(){
  //   this.generalSvc.apiRest("GET", "scripts").subscribe({
  //     next: (resp: any) => {
  //       if (resp.status) {
  //         this.lstScripts_O = resp.data;
  //         this.lstScripts = resp.data;
  //       } else {
  //         this.func.showMessage("error", "Scripts", resp.message);
  //       }
  //     },
  //     error: (err: any) => {
  //       this.func.handleErrors("Scripts", err);
  //     },
  //   });
  // }

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

  initial(){
    this.lstHistory.push(
      {texto: `Bienvenido! a LiSAH Terminal de ${this.work.nombre}`, clase:"text-green"},
      {texto: moment().format("YYYY-MM-DD HH:mm:ss"), clase:"text-green"},
      // {texto: "Seleccione medio de comunicacion", clase:"text-white"},
      // {texto: `1) Conexión vía LiSAH - Sentinel, ${this.work.host}:${this.work.agente_puerto}`, clase:"text-white"},
      // {texto: `2) Conexión vía SSH, ${this.work.host}:${this.work.ssh_puerto}`, clase:"text-white"},
    )
    this.prompt = "$";
    
    this.ir();

    this.metodo_seleccionado = 2;        //1 -WS 2-SSH
    this.modoConexion()

    // setTimeout(()=>{
    //   this.terminal.nativeElement.focus();
    // },500)
  }

  modoConexion(){
    if (this.metodo_seleccionado==1){
      this.historico(`Conectando a LiSAH - Sentinel del servidor ${this.work.nombre}, ${this.work.host}:${this.work.agente_puerto} ...`);
      this.openWS();
    } else if (this.metodo_seleccionado==2){
      // console.log("SSH")
      this.metodo_seleccionado == 2;
      this.historico(`Conectando por SSH a servidor ${this.work.nombre}, ${this.work.host}:${this.work.ssh_puerto} ...`);
      this.onSendCommands(["pwd","whoami"]);
      return;
    }
    // this.terminal.nativeElement.focus();
  }

  historicoCmds(cmd:string = ""){
    let found = false;
    this.lstHistoryCmds_O.forEach((e:any)=>{
        if (e == cmd){
          found = true
        }
    });
    if (!found){
      this.lstHistoryCmds_O.push(cmd);
    }
    this.lstHistoryCmds = Array.from(this.lstHistoryCmds_O);
  }

  terminalTecla(event:any){
    if (event.keyCode == 13){
      //enviar
      this.historico(this.prompt + " " + this.texto);
      this.historicoCmds(this.texto);

      if (this.texto.toLowerCase() == "clear"){
        this.clear();
        this.texto = "";
        return
      }

      if (this.texto.toLowerCase() == "start"){
        this.clear();
        this.texto = "";
        this.initial();
        return
      }

      if (this.texto.toLowerCase() == "exit"){
        if (this.metodo_seleccionado==1){
          this.ws.close(1000)
          this.ws = null;
          this.agente_status = "Desconectado";
          this.work.healthy_agente = 'FAIL|Desconectado';
          this.connState();
        }
        this.metodo_seleccionado == 0;
        this.clear();
        this.texto = "";
        // this.initial();
        this.funcBack()
        return
      }

      // if (this.texto.toLowerCase() == "cd .." || this.texto.toLowerCase() == "cd.."){
      //   this.onSendCommands("cd ..");
      //   setTimeout(()=>{
      //     this.onSendCommands("pwd");
      //   },500)
      //   return
      // }

      // if (this.texto.toLowerCase() == "cd /" || this.texto.toLowerCase() == "cd/"){
      //   this.onSendCommands("cd /");
      //   setTimeout(()=>{
      //     this.onSendCommands("pwd");
      //   },500)
      //   return
      // }

      this.onSendCommands([this.texto]);
      
      this.texto = "";
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

  onSendCommands(cmd_array:any=[], usr = ""){
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
        usuario: usr == "" ? this.user.usuario : usr,
        id: Math.floor(Math.random() * (9999999999999999 - 1000000000000000 + 1)) + 1000000000000000
      },
      data: cmds
    };

    if (this.light_ws){
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
      this.onSendCommands(["pwd", "whoami"], "");
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

  async onMessageListener(e:any){
    console.log(`↓ LlegoMensaje ${this.work.idservidor}`);
    let data = e.data;
    try{
      data = JSON.parse(e.data);
    }catch(err){
      data = e.data;
    }

    console.log("↓→", data)

    if (this.metodo_seleccionado == 2){ //Cuando es SSH debe enviarse lo generado a base transaccional
      await this.mongoSvc.apiMongo("POST", "savecmd", data).subscribe({
        next: resp => {
          console.log("Mongo", resp)
        },
      });
    }

    this.procesando = false;
    data.data.forEach((cmd:any) => {
      let resp = atob(cmd.respuesta);
      let command = atob(cmd.cmd);
      console.log("▬", command, resp)
      switch(command){
        case "pwd":
          this.pwd = resp.replace(/\n/g, '');
          this.actualizaPrompt();
          break;
        case "whoami":
          this.whoami = resp.replace(/\n/g, '');
          if (this.whoami == ""){
            this.historico(`Es posible que el usuario ${this.user.usuario} no exista en el servidor. No puede establecer conexión estable.`);
          }
          this.actualizaPrompt();
          break;
        default:
          this.historico(resp);
          break;
      }
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

  copia(item:string){
    this.texto = item;
    this.terminal.nativeElement.focus();
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


  insertar(cmd:any = ""){
    this.texto = cmd;
    this.terminal.nativeElement.focus();
  }

  // insertarScript(idscript:any){
  //   let cmds:any = [];
  //   this.lstScripts_O.forEach((e) => {
  //     if (e.idscript == idscript) {
  //       cmds = e.cmds
  //     }
  //   });

  //   if (cmds.length>0){
  //     cmds.forEach((c:any)=>{

  //       this.historico(c.linea_comando);
  //     })
  //   }
  // }


}
