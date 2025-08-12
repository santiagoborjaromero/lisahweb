import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Sessions } from '../../../core/helpers/session.helper';
import { Functions } from '../../../core/helpers/functions.helper';
import { ServidorService } from '../../../core/services/servidor.service';
import { WSService } from '../../../core/services/ws.service';
import iconsData from '../../../core/data/icons.data';
import { Workspace } from '../workspace';
import { Global } from '../../../core/config/global.config';
import { createGrid, GridApi, GridOptions, ICellRendererParams } from 'ag-grid-community';
import Swal from 'sweetalert2';
import { ConfigService } from '../../../core/services/config.service';

@Component({
  selector: 'app-servicios',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './servicios.html',
  styleUrl: './servicios.scss',
  standalone: true
})
export class Servicios implements OnInit {
  private readonly cfgSvc = inject(ConfigService);
  private readonly sessions = inject(Sessions);
  private readonly func = inject(Functions);
  private readonly serverSvc = inject(ServidorService);
  private readonly agente = inject(WSService);
  private readonly parent = inject(Workspace);
  
  Title = "Servicios";
  TAB = "servicios";

  user: any | undefined;
  work: any | undefined;
  icono = iconsData;
  area = "servicios";

  global = Global;
  agente_status:string = "Desconectado";
  rstConfig: any = null;
  lstServicios: Array<any> = [];
  lstUsuarios: Array<any> = [];
  lstComandos: Array<any> = [];
  noti: any = null;

  public dtOptions: any = {};
  public gridOptions: GridOptions<any> = {};
  public gridApi?: GridApi<any>;
  public id_selected: string = '';
  public name_selected: string = '';
  public user_selected: any = null;
  public is_deleted: any = null;
  
  lstAcciones:any = [];

  /**
   * Sentinel
   */
  ws: any;
  reconnect: boolean = false;
  light_ws: boolean =false;


  constructor(){
    this.parent.findTab(this.TAB);
    this.lstAcciones = [];
  }

  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get("user"));
    this.work = JSON.parse(this.sessions.get("work"));

    this.dataGridStruct();
    this.openWS();
    
    setTimeout(()=>{
      this.initial();
    },300)

  }

  ngOnDestroy(): void {
    this.ws.close(1000);
    this.ws = null
  }

  initial(){
    this.id_selected = "";
    this.name_selected = "";
    this.user_selected = null;
    this.is_deleted = "";
    this.getDataUsuarios();
    this.getDataConfiguracion();
  }

  getDataUsuarios() {
    this.lstUsuarios = [];
    this.func.showLoading('Cargando');
    this.id_selected = '';
    this.is_deleted = '';

    this.serverSvc.getOneWithUsers(this.work.idservidor).subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        if (resp.status) {
          if (resp.data[0].usuarios.length > 0){
            resp.data[0].usuarios.forEach((e:any)=>{
              e["servidor"] = null;
              this.lstUsuarios.push(e)
            })
          }
          if (resp.data[0].comandos.length > 0){
            this.lstComandos = resp.data[0].comandos;
          }
          this.traerListaDeServicios();
        } else {
          this.func.handleErrors("Data", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
        this.func.handleErrors("Servicios", err);
      },
    });
  }

  getDataConfiguracion() {
    this.cfgSvc.getAll().subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.rstConfig = resp.data[0];
        } else {
          // this.func.showMessage("error", "Configuracion", resp.message);
          this.func.handleErrors("Configuracion", resp.message);
        }
      },
      error: (err: any) => {
        this.func.handleErrors("Configuracion", err);
      },
    });
  }

  buscarComando(area="", accion="", servicio=""){
    let arr:any = [];
    this.lstComandos.forEach((c:any)=>{
      if (c.area == area && c.accion == accion){
        arr.push({
          id: `${c.area}|${c.accion}`,
          cmd: this.parser(c.comando, servicio)
        });
      }
    })
    return arr;
  }

  parser(linea:string, servicio=""){
    let l = linea;
    if (l.indexOf("{nombre_servicio}")>-1){
      l = l.replace(/{nombre_servicio}/gi, servicio);
    }
    return l
  }

  dataGridStruct() {
    let that = this;
    this.gridOptions = {
      rowData: [],
      pagination: true,
      paginationPageSize: 50,
      paginationPageSizeSelector: [5, 10, 50, 100, 200, 300, 1000],
      // rowSelection: 'single',
      rowHeight: 35,
      groupHeaderHeight: 35,
      headerHeight: 35,
      defaultColDef: {
        flex: 1,
        minWidth: 100,
        filter: true,
        // enableCellChangeFlash: true,
        headerClass: 'bold',
        floatingFilter: true,
        resizable: false,
        sortable: true,
      },

      // skipHeaderOnAutoSize: true,
      onRowClicked: (event: any) => {
        this.id_selected = event.data.idusuario;
        // this.name_selected = event.data.nombre;
        this.user_selected = event.data;
        // this.checkNovedades();
      },
      // autoSizeStrategy: {
      //   type: 'fitCellContents',
      // },
      columnDefs: [
        {
          headerName: 'Descripicion',
          headerClass: 'th-normal',
          field: 'description',
          cellClass: 'text-start',
          filter: true,
        },
        {
          headerName: 'Servicio',
          headerClass: 'th-normal',
          field: 'servicio',
          cellClass: 'text-start',
          filter: false,
        },
        {
          headerName: 'Inicio Automatico',
          headerClass: 'th-normal',
          field: 'load',
          cellClass: 'text-start',
          filter: true,
          editable: true,
          maxWidth:200,
          cellRenderer: this.renderLoad.bind(this),
        },
        {
          headerName: 'Estado',
          headerClass: 'th-normal',
          field: 'active',
          cellClass: 'text-start',
          filter: true,
          maxWidth:120,
          cellRenderer: this.renderEstado.bind(this),
          sort: "asc"
        },
      ],
    };

    that.gridApi = createGrid(document.querySelector<HTMLElement>('#myGrid')!, this.gridOptions );
  }

  refreshAll() {
    var params = {
      force: true,
      suppressFlash: true,
    };
    this.gridApi!.refreshCells(params);
    this.gridApi!.setGridOption('rowData', this.lstServicios);
  }

  renderAcciones(params: ICellRendererParams) {
    let button: any | undefined;
    if (params.data.servidor == null){
      button = document.createElement('button');
      button.className = 'btn btn-white';
      button.innerHTML = `<i role="img" class="fas fa-plus text-primary" title='Crear Usuario'></i>`;
      button.addEventListener('click', () => {
        // this.creaUsuario(params.data);
      });
    }
    return button;
  }

  renderLoad(params: ICellRendererParams) {
    let button: any | undefined;
    let icono = 'far fa-times-circle text-danger';
    let help =  'Habilitar';
    let accion =  'habilitar';
    if (params.value.trim() == "enabled"){
      icono = 'far fa-check-circle text-success'; 
      help =  'Deshabilitar';
      accion =  'deshabilitar';
    }
    button = document.createElement('button');
    button.className = "btn btn-link";
    button.innerHTML = `<i role="img" class="${icono}" title='Cambiar'></i> <span class="link" title="Cambia a ${help}">${params.value.trim()}</span>`;
    button.addEventListener('click', () => {
      this.operaciones(accion, params.data.servicio.trim())
    });
    return button;
  }

  renderEstado(params: ICellRendererParams) {
    let button: any | undefined;
    let icono = 'far fa-times-circle text-danger';
    let help =  'Iniciar';
    let accion =  'iniciar';
    if (params.value.trim() == "active"){
      icono = 'far fa-check-circle text-success'; 
      help =  'Detener';
      accion =  'detener';
    }
    button = document.createElement('button');
    button.className = "btn btn-link";
    button.innerHTML = `<i role="img" class="${icono}" title='Cambiar'></i> <span class="link" title="Cambia a ${help}">${params.value.trim()}</span>`;
    button.addEventListener('click', () => {
      this.operaciones(accion, params.data.servicio.trim())
    });
    return button;
  }

  operaciones(que="", servicio=""){
    let found = false;
    let leyenda = "";

    Swal.fire({
      allowOutsideClick: false,
      allowEscapeKey: false,
      title: 'Pregunta',
      text: `Para ${que} el servicio ${servicio}, debe escribir la palabra ${que}.`,
      icon: 'question',
      input: 'text',
      inputPlaceholder: que,
      showCancelButton: true,
      confirmButtonColor: '#33a0d6',
      confirmButtonText: 'Confirmar',
      cancelButtonColor: '#f63c3a',
      cancelButtonText: 'Cancelar',
      showClass: { backdrop: 'swal2-noanimation', popup: '' },
      hideClass: { popup: '' },
      inputValidator: (text) => {
        return new Promise((resolve) => {
          if (text.trim() !== '' && text.trim() == que) {
            resolve('');
          } else {
            resolve(`Para ${leyenda}, debe ingresar ${que}.`);
          }
        });
      },
    }).then((res) => {
      if (res.isConfirmed) {
        this.ejecutaOperaciones(que, servicio);
      }
    });
  }
  
  ejecutaOperaciones(accion="", servicio=""){
    console.log(`→ ${accion} ←`)
    let cmd:any = null;
    switch(accion){
      case "crear":
        break;
      case "crear_clave":
        break;
      default:
        cmd = this.buscarComando(this.area, accion, servicio);
        break;
    }
    // console.log("↑", cmd)
    if (!cmd) return 
    let params = {
      action: "comando",
      identificador: {
        idcliente: this.user.idcliente,
        idusuario: this.user.idusuario,
        idservidor: this.work.idservidor,
        id: Math.floor(Math.random() * (9999999999999999 - 1000000000000000 + 1)) + 1000000000000000
      },
      data: cmd
    };
    this.onSendCommands(params);
  }

  /**
   * WebSocket
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
    let status = '';
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
    console.log("█ Desconectado")
    console.log(`X Desconectado ${this.work.idservidor}`);
    if (event.code == 1000){
      this.agente_status = "Desconectado manualmente";
    }else{
      this.work.healthy_agente = 'FAIL|Desconectado';
      this.agente_status = "Desconectado";
      if (this.reconnect) this.traerListaDeServicios();
    }
  }

  onErrorListener(event: any) {}

  onMessageListener(e: any) {
    console.log(`↓ LlegoMensaje ${this.work.idservidor}`);
    let data = JSON.parse(e.data);
    console.log(data)
    this.func.closeSwal();
    let r = "";
    let acum:any = [];
    let rd:any = [];
    let aux:any | undefined;
    data.data.forEach((d:any)=>{
      d.respuesta= atob(d.respuesta);
      switch(d.id){
        // case `${this.area}|listar_todo`:
        case `lista_servicios`:
          let dat = d.respuesta.replace(/\n/g, ',');
          let rd:any = (dat.split("|"));
          acum = [];
          rd.forEach((rs:any)=>{
            let rss = rs.split(",");
            if (rss[0]!="") acum.push(rss)
          })
          // console.log(acum)
          acum.forEach((e:any)=>{
            if (!["static","alias","masked","indirect"].includes(e[2])){
              this.lstServicios.push({
                servicio: e[0],
                description: e[1],
                load: e[2],
                active: e[3],
              })
            }
          })
          this.refreshAll();
          this.func.closeSwal();
          break;
        default:
          this.func.closeSwal();
          setTimeout(()=>{
            this.traerListaDeServicios();
          },800)
          break;
      }
    })
  }

  onSendCommands(params:any=null){
    this.func.showLoading("Cargando");
    if (this.connState()){
      this.ws.send(JSON.stringify(params));
    }else{
      this.openWS();
      setTimeout(()=>{
        this.onSendCommands(params)
      },1000)
    }
  }

  traerListaDeServicios(){
    let params = {
      action: "lista_servicios",
      identificador: {
        idcliente: this.user.idcliente,
        idusuario: this.user.idusuario,
        idservidor: this.work.idservidor,
        id: Math.floor(Math.random() * (9999999999999999 - 1000000000000000 + 1)) + 1000000000000000
      },
      data: []
    };
    // this.func.showLoading('Cargando');
    this.onSendCommands(params);
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
