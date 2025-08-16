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
  // @ViewChild("terminal") terminal!: ElementRef<any> ;
  @ViewChild('terminal', { static: false }) public terminal!: ElementRef;
  @ViewChild('divterminal', { static: false }) public divterminal!: ElementRef;

  private readonly route = inject(ActivatedRoute);
  private readonly sessions = inject(Sessions);
  private readonly func = inject(Functions);
  private readonly serverSvc = inject(ServidorService);
  private readonly parent = inject(Workspace);
  private readonly generalSvc = inject(GeneralService);
  private readonly viewportScroller = inject(ViewportScroller);
  
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
  metodo_seleccionado: number = 0;
  lstGrupoUsuarios:any = [];
  ws_error:number = 0;
  ws_error_limit:number = 3;

  /**
   * SSH
   */
  
  /**
   * Terminal
   */
  lstHistory:Array<any> = [];
  lstHistory_Complete:Array<any> = [];
  lstHistoryCmds:Array<any> = [];
  texto:string = "";
  prompt: string = "";
  firstTime: boolean = true; 
  procesando: boolean = false; 

  whoami: string = "";
  pwd: string = "";

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
  }
  
  initial(){
    this.lstHistory.push(
      {texto: "Bienvenido! a LiSAH Terminal", clase:"text-green"},
      {texto: moment().format("YYYY-MM-DD HH:mm:ss"), clase:"text-green"},
      {texto: "Seleccione medio de comunicacion", clase:"text-white"},
      {texto: `1) Conexión vía LiSAH - Sentinel, ${this.work.host}:${this.work.agente_puerto}`, clase:"text-white"},
      {texto: `2) Conexión vía SSH, ${this.work.host}:${this.work.ssh_puerto}`, clase:"text-white"},
    )
    this.prompt = this.user.usuario + ">";
    setTimeout(()=>{
      this.terminal.nativeElement.focus();
    },500)
    this.firstTime = true;
    this.ir();
    
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

  terminalTecla(event:any){
    if (event.keyCode == 13){
      //enviar
      this.historico(this.prompt + " " + this.texto);
      

      if (this.firstTime){
        if (parseInt(this.texto)==1){
          // console.log("Sentinel")
          this.metodo_seleccionado = 1;
          this.texto = "";
          this.firstTime = false;
          this.historico(`Conectando a LiSAH - Sentinel del servidor ${this.work.nombre}, ${this.work.host}:${this.work.agente_puerto} ...`);
          this.openWS();
          return; 
        } else if (parseInt(this.texto)==2){
          // console.log("SSH")
          this.metodo_seleccionado = 2;
          this.texto = "";
          this.historico(`Conectando por SSH a servidor ${this.work.nombre}, ${this.work.host}:${this.work.agente_puerto} ...`);
          this.firstTime = false;
          this.onSendCommands(["pwd","whoami"]);
          return;
        } else {
          this.initial();
          return;
        }
      }

      this.historicoCmds(this.texto);

      if (this.texto.toLowerCase() == "clear"){
        this.clear();
        this.texto = "";
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
        this.initial();
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


}
