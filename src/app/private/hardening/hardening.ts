import { Component, inject } from '@angular/core';
import { Breadcrums } from '../shared/breadcrums/breadcrums';
import { Header } from '../shared/header/header';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  AllCommunityModule,
  createGrid,
  GridApi,
  GridOptions,
  ICellRendererParams,
  ModuleRegistry,
} from 'ag-grid-community';
// import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Observable } from 'rxjs';
import { ServidorService } from '../../core/services/servidor';
import { Functions } from '../../core/helpers/functions.helper';
import { Sessions } from '../../core/helpers/session.helper';
import { UsuarioService } from '../../core/services/usuarios';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-hardening',
  imports: [Breadcrums, Header, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './hardening.html',
  styleUrl: './hardening.scss',
  standalone: true,
})
export class Hardening {
  private readonly userSvc = inject(UsuarioService);
  private readonly serverSvc = inject(ServidorService);
  private readonly func = inject(Functions);
  private readonly sessions = inject(Sessions);

  user: any = null;

  accion: string = 'activos';
  canR: boolean = true;
  canW: boolean = true;
  canD: boolean = true;

  public dtOptions: any = {};
  public gridOptions: GridOptions<any> = {};
  public gridApi?: GridApi<any>;
  public id_selected: string = '';
  public is_deleted: any = null;

  public dtOptions2: any = {};
  public gridOptions2: GridOptions<any> = {};
  public gridApi2?: GridApi<any>;
  public id_selected2: string = '';
  public is_deleted2: any = null;

  lstServidores_Original: Array<any> = [];
  lstServidores: Array<any> = [];
  lstWork: Array<any> = [];
  lstEventsSent: Array<any> = [];
  wsConn: any = null;

  chkMonitor: boolean = false;
  chkTerminal: boolean = false;
  chkDiferido: boolean = false;

  constructor() {}

  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get('user'));
    // console.log(this.user.token)

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
  }

  ngAfterViewInit(): void {
    this.dataGridStruct();
    this.dataGridStruct2();
    // this.getServidores();
    this.getUsuario();
  }


  getUsuario() {
    this.lstServidores_Original = [];
    this.func.showLoading('Cargando Servidores del Usuario');
    this.id_selected = '';
    this.is_deleted = '';

    this.userSvc.getOne(this.user.idusuario).subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        console.log(resp)
        if (resp.status) {
          if (resp.data[0].servidores && resp.data[0].servidores.length>0){
            this.lstServidores_Original = resp.data[0].servidores;
          }
          // this.refreshAll();
          this.actualizaServidores()
          // if (resp.data.length>0){
          //   resp.data.forEach((s:any)=>{
          //     s.uptime = "";
          //     s.healthy_ssh = -2;
          //     s.healthy_agente = -2;
          //     this.lstServidores.push(s);
          //   })
          // }
        } else {
          this.func;
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
      },
    });
  }

  // getServidores() {
  //   this.lstServidores = [];
  //   this.func.showLoading('Cargando');
  //   this.id_selected = '';
  //   this.is_deleted = '';

  //   this.serverSvc.getAll().subscribe({
  //     next: (resp: any) => {
  //       this.func.closeSwal();
  //       if (resp.status) {
  //         this.lstServidores = [];
  //         if (resp.data.length>0){
  //           resp.data.forEach((s:any)=>{
  //             s.uptime = "";
  //             s.healthy_ssh = -2;
  //             s.healthy_agente = -2;
  //             this.lstServidores.push(s);
  //           })

  //         }
  //         this.lstServidores_Original = Array.from(this.lstServidores);
  //       } else {
  //         this.func;
  //       }
  //     },
  //     error: (err: any) => {
  //       this.func.closeSwal();
  //     },
  //   });
  // }

  async connectWS() {
    let host = 'localhost';
    let puerto = 4700;
    console.log(`Conectando ${host}:${puerto}`);
    if (this.wsConn !== null) console.log('No hago nada aqui esta conectado');

    this.wsConn = new WebSocket(`ws://${host}:${puerto}`);
    // const opened = await this.connection(this.wsConn);
    // console.log(opened);
    // if (opened) {
    //   this.wsConn.send('hello');
    // } else {
    //   console.log(
    //     "the socket is closed OR couldn't have the socket in time, program crashed"
    //   );
    //   return;
    // }
    this.wsConn.onopen = (event:any) => this.onOpenListener(event);
    this.wsConn.onmessage = (event:any) => this.onMessageListener(event);
    this.wsConn.onclose = (event:any) => this.onCloseListener(event);
    this.wsConn.onerror = (event:any) => this.onErrorListener(event);
  }

  // async connection(socket: any, timeout = 10000) {
  //   const isOpened = () => socket.readyState === WebSocket.OPEN;

  //   if (socket.readyState !== WebSocket.CONNECTING) {
  //     return isOpened();
  //   } else {
  //     const intrasleep = 100;
  //     const ttl = timeout / intrasleep; // time to loop
  //     console.log(ttl)
  //     let loop = 0;
  //     while (socket.readyState === WebSocket.CONNECTING && loop < ttl) {
  //       await new Promise((resolve) => setTimeout(resolve, intrasleep));
  //       loop++;
  //       console.log(loop)
  //     }
  //     return isOpened();
  //   }
  // }

  onOpenListener(event: any) {
    console.log('onOpenListener', event);
    let dataSend = JSON.stringify({
      action: 'Prueba',
      whoiam: { userid: '1' },
      message: 'Este es mensaje de prueba',
    });
    this.wsConn.send(dataSend);
  }
  onMessageListener(event: any) {
    // console.log('onMessageListener', event);
    console.log(event.data)
  }
  onCloseListener(event: any) {
    console.log('onCloseListener', event);

    // this.isClose = true;
    this.lstEventsSent = [];

    if (event.code != 1000)
      console.log('onCloseListener', 'code: ' + event.code);

    let lstErrorCodeCloseListener = [
      { code: 1000, type: 'info', reconnect: false, reason: 'Normal Closure' },
      {
        code: 1001,
        type: 'error',
        reconnect: true,
        reason: 'Going away, time expired',
      },
      { code: 1002, type: 'error', reconnect: true, reason: 'Protocol error' },
      {
        code: 1003,
        type: 'error',
        reconnect: true,
        reason: 'Unsupported Data',
      },
      { code: 1004, type: 'error', reconnect: true, reason: 'Reserved' },
      { code: 1005, type: 'info', reconnect: false, reason: 'No Status Rcvd' },
      {
        code: 1006,
        type: 'error',
        reconnect: true,
        reason: 'Abnormal Closure',
      },
      {
        code: 1007,
        type: 'error',
        reconnect: true,
        reason: 'Invalid frame payload data',
      },
      {
        code: 1008,
        type: 'error',
        reconnect: true,
        reason: 'Policy Violation',
      },
      { code: 1009, type: 'error', reconnect: true, reason: 'Message Too Big' },
      { code: 1010, type: 'error', reconnect: true, reason: 'Mandatory Ext.' },
      { code: 1012, type: 'error', reconnect: true, reason: 'Service Restart' },
      {
        code: 1013,
        type: 'error',
        reconnect: false,
        reason: 'Try Again Later',
      },
      { code: 1014, type: 'error', reconnect: false, reason: 'Bad Gateway' },
      { code: 3000, type: 'error', reconnect: true, reason: 'Unauthorized' },
    ];

    let type = 'error';
    let msgerror = '';
    lstErrorCodeCloseListener.forEach((e) => {
      if (e.code == event.code) {
        type = e.type;
        msgerror = e.reason;
      }
    });

    console.log(type, msgerror);
  }
  onErrorListener(event: any) {
    console.log('onErrorListener', JSON.stringify(event));
  }

  sendMessage() {
    this.wsConn.send('HOla');
  }

  dataGridStruct() {
    let that = this;
    this.gridOptions = {
      rowData: [],
      pagination: false,
      paginationPageSize: 10,
      paginationPageSizeSelector: [5, 10, 50, 100, 200, 300, 1000],
      // rowSelection: 'single',
      rowHeight: 40,
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
      onRowClicked: (event: any) => {
        this.id_selected = event.data.idservidor;
        this.is_deleted = event.data.deleted_at;
      },
      columnDefs: [
        {
          headerName: 'ID',
          field: 'idservidor',
          filter: false,
          hide: true,
        },
        {
          headerName: 'Nombre Servidor',
          field: 'nombre',
          cellClass: 'text-start',
          filter: true,
        },
        {
          headerName: 'Accion',
          field: 'idtemplate_comando',
          cellClass: 'text-start',
          cellRenderer: this.renderAccion.bind(this),
          autoHeight: true,
          filter: false,
          maxWidth:100,
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
    this.gridApi!.setGridOption('rowData', this.lstServidores);
  }

  renderAccion(params: ICellRendererParams) {
    const button = document.createElement('button');
    button.className = 'btn btn-link text-primary';
    button.innerHTML = '<i class="fas fa-plus-circle t20"></i>';
    button.addEventListener('click', () => {
      this.addserver(params.data);
    });
    return button;
  }

  dataGridStruct2() {
    let that = this;
    this.gridOptions2 = {
      rowData: [],
      pagination: false,
      paginationPageSize: 10,
      paginationPageSizeSelector: [5, 10, 50, 100, 200, 300, 1000],
      // rowSelection: 'single',
      rowHeight: 40,
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
      onRowClicked: (event: any) => {
        this.id_selected2 = event.data.idservidor;
        this.is_deleted2 = event.data.deleted_at;
      },
      columnDefs: [
        {
          headerName: 'ID',
          field: 'idservidor',
          filter: false,
          hide: true,
        },
        {
          headerName: 'Nombre Servidor',
          field: 'nombre',
          cellClass: 'text-start',
          filter: true,
        },
        {
          headerName: 'Accion',
          field: 'idtemplate_comando',
          cellClass: 'text-start',
          cellRenderer: this.renderAccion2.bind(this),
          autoHeight: true,
          filter: false,
          maxWidth:100,
        },

      ],
    };

    that.gridApi2 = createGrid(
      document.querySelector<HTMLElement>('#myGrid2')!,
      this.gridOptions2
    );
  }

  refreshAll2() {
    var params = {
      force: true,
      suppressFlash: true,
    };
    this.gridApi2!.refreshCells(params);
    this.gridApi2!.setGridOption('rowData', this.lstWork);
  }

   renderAccion2(params: ICellRendererParams) {
      const button = document.createElement('button');
      button.className = 'btn btn-link text-danger';
      button.innerHTML = '<i class="far fa-trash-alt"></i>';
      button.addEventListener('click', () => {
        this.removeServer(params.data.idservidor);
      });
      return button;
   }

   addserver(server:any){
    this.lstWork.push(server);
    this.actualizaServidores();
   }

   removeServer(idServidor:any){
    this.lstWork.forEach((e,idx)=>{
      if (e.idservidor == idServidor){
        this.lstWork.splice(idx,1);
      }
    })
    this.actualizaServidores();
   }

   actualizaServidores(){
    let found = false;
    this.lstServidores = [];
    this.lstServidores_Original.forEach(s=>{
      found = false;
      this.lstWork.forEach( (e,idx)=>{
        if (e.idservidor == s.idservidor){
          found = true;
        }
      })
      // s.check = found;
      if (!found){
        this.lstServidores.push(s);
      }
    })
    this.refreshAll();
    this.refreshAll2();
  }

  goWork(){
    let data = {
      servidores: this.lstWork,
      monitor: this.chkMonitor,
      terminal: this.chkTerminal,
      diferido: this.chkDiferido,
    }

    this.sessions.set("work", JSON.stringify(data));

    this.func.goRoute(`admin/hardening/workspace`, true, false, true);

  }
}
