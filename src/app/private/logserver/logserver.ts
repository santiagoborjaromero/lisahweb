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
import { AllCommunityModule, createGrid, GridApi, GridOptions, ModuleRegistry } from 'ag-grid-community';
import { MongoService } from '../../core/services/mongo.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-logserver',
  imports: [Titulo, Path, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './logserver.html',
  styleUrl: './logserver.scss',
  standalone: true
})
export class Logserver {
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

  lstData: Array<any> = [];
  lstUsuarios: Array<any> = [];
  lstServidores: Array<any> = [];
  lstServidores_Original: Array<any> = [];
  idservidor:string = "";
  idscript:string = "";
  fecha_select:string = "";
  idservidor_select:string = "";
  idusuario_select: string = "0";

  oBuscarHistorico:string = "";
  oBuscarComandos:string = "";
  oBuscarScripts:string = "";

  public dtOptions: any = {};
  public gridOptions: GridOptions<any> = {};
  public gridApi?: GridApi<any>;
  public id_selected: string = '';
  public is_deleted: any = null;
  public name_selected: string = '';
  public rows_selected: any = 0;
  public server_selected: any = {};

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

  constructor() {}

  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get('user'));
    // this.work = JSON.parse(this.sessions.get("work"));

    
    this.path = [
      {nombre: "Admin & Hardening", ruta: ""}, 
      {nombre: "Auditoría de Logs", ruta: "admin/logs"}, 
      // {nombre: `Logs ${this.work.nombre}`, ruta: ""}, 
    ];
  
    this.titulo = {icono: "fas fa-traffic-light",nombre: `Auditoría de Logs`}

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
    this.fecha_select = moment().format("YYYY-MM-DD")

    this.getUsuario();
    this.getServidores();
    this.dataGridStruct();
  }

  ngOnDestroy(): void {
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

  getServidores() {
    this.lstServidores = [];
    this.func.showLoading('Cargando');

    this.serverSvc.getAllFilters("activos").subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.lstServidores = resp.data;
          this.idservidor_select = this.lstServidores[0].idservidor;
          this.lstUsuarios = this.lstServidores[0].usuarios

        } else {
          this.func.handleErrors("Servidor", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
        this.func.handleErrors("Servidor", err);
      },
    });
  }

  cambiaServidor(){
     this.lstServidores.forEach((s,idx)=>{
      if (s.idservidor == this.idservidor_select){
         this.lstUsuarios = this.lstServidores[idx].usuarios
      }
     })
     this.idusuario_select = "0";
  }

  // initial(){
  //   this.openWS();
  // }

  funcBack(){
    this.func.irRuta(`admin/logs`);
  }

  

  openWS() {
    this.lstServidores.forEach(s=>{
      if (s.idservidor == this.idservidor_select){
        this.work = s;
      }
    })

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
    if (event.type == 'open') {
      console.log(`√ Conectado ${this.work.idservidor}`);
      this.agente_status = "Conectado";
      this.work.healthy_agente = 'OK|Conectado';
      this.connState();
      this.onSendCommands();
    } else {
      this.agente_status = "No se estableció conexion con Sentinel";
      console.log(`X Desconectado ${this.work.idservidor}`);
      this.work.agente_status = 'FAIL|Desconectado';
    }
  }

  onCloseListener(event: any) {
    // console.log('onCloseListener', event);
    console.log(`X Desconectado ${this.work.idservidor}`);
    if (event.code == 1000){
      this.agente_status = "Desconectado manualmente";
      this.ws_error = 0;
    }else{
      this.work.healthy_agente = 'FAIL|Desconectado';
      this.agente_status = "Desconectado";
      this.func.showMessage("error", "Logs", `El servidor ${this.work.nombre} no se encuentra disponible. Contacte con el administrador.`)
    }
  }

  onErrorListener(event: any) {}

  onMessageListener(e:any){
    console.log(`↓ LlegoMensaje ${this.work.idservidor}`);
    let evento = JSON.parse(e.data);
    
    let data = evento.data;
    let status = evento.status;

    if (!status) {
      this.func.showMessage("error", "Logs", data)
      return
    }

    this.lstData = [];
    data.forEach( (d:any) => {
      d.data.forEach((e:any) => {
        let cmd = "";
        try{
          cmd = atob(e.cmd);
        }catch(err){
          cmd = "";
        }
        this.lstData.push({
          fecha: d.fecha,
          usuario: d.usuario,
          accion: e.id,
          comando: cmd
        })
      });
    });
    this.refreshAll();
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


  onSendCommands(){
    let params = {
      action: "logs",
      identificador: {
        idcliente: this.user.idcliente,
        idusuario: this.user.idusuario,
        usuario: this.user.usuario,
        idservidor: this.idservidor_select,
        fecha: this.fecha_select,
        idusuario_select: this.idusuario_select,
        id: Math.floor(Math.random() * (9999999999999999 - 1000000000000000 + 1)) + 1000000000000000
      },
      data: []
    };
    console.log(params)
    if (this.connState()){
      console.log("↑ Enviando")
      this.ws.send(JSON.stringify(params));
    }
  }

  dataGridStruct() {
    let that = this;
    this.gridOptions = {
      rowData: [],
      pagination: true,
      paginationPageSize: 50,
      paginationPageSizeSelector: [5, 10, 50, 100, 200, 300, 1000],
      // rowSelection: 'single',
      // rowHeight: 40,
      defaultColDef: {
        flex: 1,
        minWidth: 50,
        filter: false,
        headerClass: 'bold',
        floatingFilter: false,
        resizable: false,
        sortable: true,
        wrapText: true,
        wrapHeaderText: true,
        suppressAutoSize: true,
        autoHeaderHeight: true,
        suppressSizeToFit: true,
      },
      onRowClicked: (event: any) => {
        this.id_selected = event.data.idservidor;
        this.is_deleted = event.data.deleted_at;
        this.name_selected = event.data.nombre;
        if (this.rows_selected==0 && this.id_selected!='') this.rows_selected=1;
        this.server_selected = event.data
      },
      columnDefs: [
        {
          headerName: 'ID',
          headerClass: ["th-center", "th-normal"],
          field: 'id',
          filter: false,
          hide: true,
        },
        {
          headerName: 'Fecha',
          headerClass: ["th-center", "th-normal"],
          field: 'fecha',
          cellClass: 'text-start',
          filter: true,
          maxWidth: 200,
        },
        {
          headerName: 'Usuario',
          headerClass: ["th-center", "th-normal"],
          field: 'usuario',
          cellClass: 'text-start',
          filter: true,
          maxWidth: 300,
        },
        {
          headerName: 'Accion',
          headerClass: ["th-center", "th-normal"],
          field: 'accion',
          cellClass: 'text-start',
          filter: true,
          maxWidth: 200,
        },
        {
          headerName: 'Comando',
          headerClass: ["th-center", "th-normal"],
          field: 'comando',
          cellClass: 'text-start',
          filter: true,
          wrapText: true
        },
      ],
    };

    that.gridApi = createGrid(
      document.querySelector<HTMLElement>('#myGrid')!,
      this.gridOptions
    );
  }
  
  refreshAll() {
    var params = {
      force: true,
      suppressFlash: true,
    };
    this.gridApi!.refreshCells(params);
    this.gridApi!.setGridOption('rowData', this.lstData);
  }

  exportarPDF(){
    let data:any = this.prepareToExport();  
    let params = {
      orientation: "p",
      titulo: this.work.nombre + " - Logs",
      data: data,
      filename: `lisah_${this.work.nombre}_logs_${moment().format("YYYYMMDDHHmmss")}.pdf`
    }
    this.func.exportarPDF(params);
  }

  exportarCSV(){
    let data:any = this.prepareToExport();  
    this.func.exportarCSV(data, `lisah_${this.work.nombre}_logs_${moment().format("YYYYMMDDHHmmss")}.csv`);
  }
  
  prepareToExport(): Array<any>{
    let arr:any = [];
    this.lstData.forEach((d:any) => {
      try{
        arr.push({
          fecha: moment(d.fecha).format("YYYY-MM-DD HH:mm:ss"),
          usuario: d.usuario ,
          accion: d.accion,
          comando: d.comando,
        })
      }catch(err){
        console.log(err, d)
      }
    });
    return arr;
  }


}
