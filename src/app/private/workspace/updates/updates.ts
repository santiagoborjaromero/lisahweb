import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Sessions } from '../../../core/helpers/session.helper';
import { Functions } from '../../../core/helpers/functions.helper';
import { ServidorService } from '../../../core/services/servidor.service';
import iconsData from '../../../core/data/icons.data';
import { Workspace } from '../workspace';
import { Global } from '../../../core/config/global.config';
import Swal from 'sweetalert2';
import { createGrid, GridApi, GridOptions, ICellRendererParams } from 'ag-grid-community';


@Component({
  selector: 'app-updates',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './updates.html',
  styleUrl: './updates.scss'
})
export class Updates implements OnInit{
  private readonly sessions = inject(Sessions);
  private readonly func = inject(Functions);
  private readonly serverSvc = inject(ServidorService);
  private readonly parent = inject(Workspace);

  Title = "Actualizaciones";
  TAB = "update"
  area = "actualizaciones";

  user:any | undefined;
  work:any | undefined;
  icono = iconsData;

  agente_status:string = "Desconectado";
  global = Global;
  lstUsuarios:any  = [];
  lstComandos:any  = [];
  lstAcciones:any  = [];
  lstNotificaciones:any  = [];
  lstData:any  = [];
  activar_acciones: boolean = false;
  playMonitor: boolean = false;

  public dtOptions: any = {};
  public gridOptions: GridOptions<any> = {};
  public gridApi?: GridApi<any>;
  public id_selected: string = '';
  public name_selected: string = '';
  public user_selected: any = null;
  public is_deleted: any = null;

  /**
   * Sentinel
   */
  ws: any;
  reconnect: boolean = false;
  light_ws: boolean =false;
  ws_error:number = 0;
  ws_error_limit:number = 3;

  constructor(){
    this.parent.findTab(this.TAB);
    this.lstAcciones = [
      {
        accion: "ver_actualizaciones", 
        titulo:"Revisar actualizaciones", 
        subtitulo: "",
        condicion: false,
      },
      {
        accion: "actualizar_sistema", 
        titulo:"Actualizar todos los paquetes", 
        subtitulo: "",
        condicion: false,
      },
      {
        accion: "actualizar_paquete", 
        titulo:"Actualizar el paquete seleccionado", 
        subtitulo: "",
        condicion: false,
      },
    ];

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
    this.getDataUsuarios();
  }

  getDataUsuarios() {
    this.lstUsuarios = [];
    this.func.showLoading('Cargando');

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
          // this.ejecutaOperaciones("ver_actualizaciones");
          this.startMonitor();
        } else {
          this.func.handleErrors("Server", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
        this.func.handleErrors("Actualizaciones", err);
      },
    });
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
      this.ws_error = 0;
    }else{
      this.work.healthy_agente = 'FAIL|Desconectado';
      this.agente_status = "Desconectado";
      if (this.reconnect && this.ws_error < this.ws_error_limit){
        this.ws_error ++;
        setTimeout(()=>{
          this.startMonitor();
        },1000)
      }
    }
  }

  onErrorListener(event: any) {}

  onMessageListener(e:any=[]){
    Swal.close()
    console.log(`↓ LlegoMensaje ${this.work.idservidor}`);
    let data = JSON.parse(e.data);
    // console.log(data)
    let r = "";
    let acum:any = [];
    let aux:any | undefined;
    data.data.forEach((d:any)=>{
      let r = atob(d.respuesta);
      switch(d.id){
        case `${this.area}|ver_actualizaciones`:
          //let rd:any = (d.respuesta.split("\n"));
          // console.log("→", r)
          if (r == ""){
            this.func.showMessage("info", "Actualizaciones",  "No hay paquetes que actualizar");
            this.lstData = [];
            this.refreshAll()
          }else{
            aux = (r.split("\n"));
            acum = [];
            aux.forEach((rs:any, idx:any)=>{
              if (rs != ""){
                let rss = rs.split(",");
                acum.push({
                  paquete: rss[0],
                  version: rss[1],
                  arquitectura: rss[2]
                })
              }
            })
            this.lstData = acum;
            this.refreshAll()
          }
          break;
        case `${this.area}|actualizar_sistema`:
          this.func.showMessage("info", "Actualización de Sistema",  r);
          break;
        default:
          console.log("Error", r)
          this.func.toast("error", r);
          this.initial();
          break;
      }
    })
  }


  buscarComando(area="", accion="", paquete=""){
    let arr:any = [];
    this.lstComandos.forEach((c:any)=>{
      if (c.area == area && c.accion == accion){
        arr.push({
          id: `${c.area}|${c.accion}`,
          cmd: this.parser(c.comando, paquete)
        });
      }
    })
    return arr;
  }

  operaciones(que="", paquete=""){
    let found = false;
    let leyenda = "";
    this.lstAcciones.forEach((c:any)=>{
      if (c.accion == que){
        leyenda = c.titulo;
        found = true;
      }
    });

    if (found){
      Swal.fire({
        allowOutsideClick: false,
        allowEscapeKey: false,
        title: 'Pregunta',
        text: `Para ${leyenda}, debe escribir la palabra ${que}.`,
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
          this.ejecutaOperaciones([{accion:que, paquete}]);
        }
      });
    }
  }


  parser(linea:string, pack=""){
    let l = linea;
    if (l.indexOf("{paquete}")>-1){
      l = l.replace(/{paquete}/gi, pack);
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
      rowHeight: 35,
      groupHeaderHeight: 35,
      headerHeight: 35,
      defaultColDef: {
        flex: 1,
        minWidth: 100,
        filter: true,
        headerClass: 'bold',
        floatingFilter: true,
        resizable: false,
        sortable: true,
      },

      onRowClicked: (event: any) => {
        this.id_selected = event.data.paquete;
      },
      columnDefs: [
        {
          headerName: 'Paquete',
          headerClass: 'th-normal',
          field: 'paquete',
          cellClass: 'text-start',
          filter: true,
        },
        {
          headerName: 'Version',
          headerClass: 'th-normal',
          field: 'version',
          cellClass: 'text-start',
          filter: false,
        },
        {
          headerName: 'Arquitectura',
          headerClass: 'th-normal',
          field: 'arquitectura',
          cellClass: 'text-start',
          filter: true,
          editable: true,
          maxWidth:200,
        },
        {
          headerName: 'Accion',
          headerClass: 'th-normal',
          cellClass: 'text-start',
          filter: true,
          maxWidth:120,
          cellRenderer: this.renderAcciones.bind(this),
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
    this.gridApi!.setGridOption('rowData', this.lstData);
  }

  renderAcciones(params: ICellRendererParams) {
    let button: any | undefined;
    button = document.createElement('button');
    button.className = 'btn btn-white';
    button.innerHTML = `<i class="fas fa-download text-primary" title='Actualizar'></i>`;
    button.addEventListener('click', () => {
      this.updatePack(params.data);
    });
    return button;
  }

  updatePack(data:any = null){
    
    this.operaciones("actualizar_paquete", data.paquete);
  }

  actualizarTodo(){
    this.operaciones("actualizar_sistema", "");    
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

  startMonitor(){
    this.playMonitor = true;
    this.ejecutaOperaciones([{accion: "ver_actualizaciones", paquete: ""}]);
  }

  ejecutaOperaciones(acciones:any=[]){
    let cmds:any = [];
    acciones.forEach((cmp:any)=>{
      console.log(`→ ${cmp.accion} ←`)
      switch(cmp.accion){
        default:
          let cmd:any = this.buscarComando(this.area, cmp.accion, cmp.paquete);
          if (Array.isArray(cmd)){
            cmd.forEach((e:any)=>{
              cmds.push(e)
            })
          }else{
            cmds.push(cmd)
          }
          break;
      }
    })
    // console.log("↑", cmds)
    if (!cmds) return 
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
