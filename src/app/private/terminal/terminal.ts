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
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-terminal',
  imports:  [Titulo, Path, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './terminal.html',
  styleUrl: './terminal.scss',
  standalone: true,
})
export class Terminal {
  // @ViewChild('terminal', { static: false }) public terminal!: ElementRef;
  // @ViewChild('divterminal', { static: false }) public divterminal!: ElementRef;

  private readonly route = inject(ActivatedRoute);
  private readonly sessions = inject(Sessions);
  private readonly func = inject(Functions);
  private readonly serverSvc = inject(ServidorService);
  private readonly generalSvc = inject(GeneralService);
  private readonly viewportScroller = inject(ViewportScroller);
  private readonly mongoSvc = inject(MongoService);
  private readonly sanitizer = inject(DomSanitizer);

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

  webssh2!:SafeResourceUrl ;

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
    setTimeout(()=>{
      this.initial();
    },800)
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

  initial(){
    // let url = `http://${this.work.host}:${this.work.terminal_puerto}/ssh/host/${this.work.host}?port=${this.work.ssh_puerto}&header=LISA&headerBackground=green&cursorBlink=true`;
    // let url = `http://192.168.1.169:8750/ssh/host/192.168.1.169?port=2222&header=LISAH&headerBackground=green&cursorBlink=true`;
    // let url = `http://192.168.1.169:8750/ssh/host/192.168.1.169?port=2222&header=LISAH&headerBackground=green`;
    let url = `http://${this.work.host}:${this.work.terminal_puerto}/ssh/host/?port=${this.work.ssh_puerto}&header=LISAH&headerBackground=green&cursorBlink=true`;
    // console.log(url)
    this.webssh2 = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    // this.webssh2 = url;
  }

  funcBack(){
    this.func.irRuta(`admin/hardening`);
  }

}
