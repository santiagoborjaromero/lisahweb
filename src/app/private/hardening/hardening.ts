import { Component } from '@angular/core';
import { Breadcrums } from '../shared/breadcrums/breadcrums';
import { Header } from '../shared/header/header';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  AllCommunityModule,
  createGrid,
  GridApi,
  GridOptions,
  ModuleRegistry,
} from 'ag-grid-community';
// import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Observable } from 'rxjs';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-hardening',
  imports: [Breadcrums, Header, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './hardening.html',
  styleUrl: './hardening.scss',
  standalone: true,
})
export class Hardening {
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

  lstData: Array<any> = [];
  lstEventsSent: Array<any> = [];
  wsConn: any = null;

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    // this.dataGridStruct();
    this.connectWS();
  }

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
      pagination: true,
      paginationPageSize: 50,
      paginationPageSizeSelector: [5, 10, 50, 100, 200, 300, 1000],
      // rowSelection: 'single',
      rowHeight: 50,
      defaultColDef: {
        flex: 1,
        minWidth: 100,
        filter: true,
        // enableCellChangeFlash: true,
        headerClass: 'bold',
        floatingFilter: false,
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
          headerName: 'Nombre',
          field: 'nombre',
          cellClass: 'text-start',
          filter: true,
        },
        {
          headerName: 'Host',
          field: 'host',
          cellClass: 'text-start',
          filter: true,
          flex: 2,
        },
        {
          headerName: 'Estado',
          field: 'estado',
          cellClass: 'text-start',
          filter: true,
        },
        {
          headerName: 'Alarmas',
          field: 'alarmas',
          cellClass: 'text-start',
          filter: true,
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
}
