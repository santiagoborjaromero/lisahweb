import { Component, inject, ViewChild } from '@angular/core';
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
import { ServidorService } from '../../core/services/servidor.service';
import { Functions } from '../../core/helpers/functions.helper';
import { Sessions } from '../../core/helpers/session.helper';
import { UsuarioService } from '../../core/services/usuarios.service';
import { Titulo } from '../shared/titulo/titulo';
import { Path } from '../shared/path/path';
import { GeneralService } from '../../core/services/general.service';
import { SentinelService } from '../../core/services/sentinel.service';
import moment from 'moment';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-monitoreo',
  imports: [Titulo, Path, CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './monitoreo.html',
  styleUrl: './monitoreo.scss',
  standalone: true,
})
export class Monitoreo {
  @ViewChild('btnModal') btnModal:any;
  private readonly userSvc = inject(UsuarioService);
  private readonly serverSvc = inject(ServidorService);
  private readonly generalSvc = inject(GeneralService);
  private readonly func = inject(Functions);
  private readonly sessions = inject(Sessions);
  private readonly wsSvc = inject(SentinelService);

  aqui: any | undefined;

  private connection = new Map<number, any>();
  private connection_status = new Map<number, any>();

  user: any = null;
  path: any = [];
  titulo: any = { icono: '', nombre: '' };
  canR: boolean = true;
  canW: boolean = true;
  canD: boolean = true;

  conteo: number = 0;
  public dtOptions: any = {};
  public gridOptions: GridOptions<any> = {};
  public gridApi?: GridApi<any>;
  public id_selected: string = '';
  public is_deleted: any = null;
  
  lstServidores: Array<any> = [];
  server_select: any ;

  playMonitor: boolean = false;
  funcionaAgente: boolean = false;
  tiempo_refresco: number = 0;
  tiempo_restante: number = 0;

  tmrMonitor: any | undefined;
  monitoreo_esta_activo: boolean = false;
  firstTime: boolean = true;
  loadMonitoreo: boolean = false;

  serverIndex: number = 0;
  continuar: boolean = false;
  revisando: string = '';

  arrServicios: any = [];

  /**
   * Sentinel
   */
  ws: any;
  reconnect: boolean = false;

  constructor() {}

  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get('user'));
    this.path = [
      { nombre: 'Admin & Hardening', ruta: '' },
      { nombre: 'Dashboard Monitoreo', ruta: 'admin/dashmonitoreo' },
    ];

    this.titulo = { icono: 'fas fa-chart-bar', nombre: 'Dashboard Monitoreo Servidores' };

    this.tiempo_refresco = this.user.config.tiempo_refresco;

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

    this.dataGridStruct();
    if (this.user.grupo && this.user.cliente){
      this.getUsuario();
    }else if (!this.user.grupo && this.user.cliente){
      this.listaTodosServidores();
    }
    
  }

  ngOnDestroy(): void {
    this.stopMonitor();
    this.connection.clear();
    this.connection_status.clear();
  }

  getUsuario() {
    this.lstServidores = [];
    this.func.showLoading('Cargando Servidores del Usuario');
    this.id_selected = '';
    this.is_deleted = '';

    this.userSvc.getOne(this.user.idusuario).subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        // console.log(resp);
        this.arrServicios = [];
        if (resp.status) {
          resp.data[0].servidores.forEach((e:any) => {
            if (e.estado == 1){
              this.lstServidores.push(e);
            }
          });
          this.seteaGrdiStructure();
        } else {
          this.func.showMessage('error', 'Usuario', resp.message);
        }
        
      },
      error: (err: any) => {
        this.func.closeSwal();
        this.func.handleErrors('Usuario', err);
      },
    });
  }

  listaTodosServidores() {
    /**
     * lista de todos los servidores
     */    
    this.func.showLoading('Cargando');
    this.generalSvc.apiRest("GET", `servidores`).subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        // console.log("→1←", resp)
        if (resp.status) {
          resp.data.forEach((e:any) => {
            if (e.estado == 1){
              this.lstServidores.push(e);
            }
          });
          this.seteaGrdiStructure();
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

  seteaGrdiStructure(){
    this.lstServidores.forEach((s: any) => {
      if (s.estado == 1){
        s['healthy_ssh'] = '-';
        s['healthy_agente'] = '-';
        s['uptime'] = '-';
        s['cpu'] = '-';
        s['memoria'] = '-';
        s['disco'] = '-';
        // s['servicio_httpd'] = '-';
        // s['servicio_ssh'] = '-';
        if (s.servicios && s.servicios!=""){
          let arrS = s.servicios.split(",")
          arrS.forEach((ss:any)=>{
            s[`servicio_${ss}`] = '';
            this.arrServicios.push(ss);
          })
        }
      }
    });
    
    // this.dataGridStruct();
    const currentColumnDefs:any = this.gridApi?.getGridOption('columnDefs');
    let newColumn:any;
    this.arrServicios.forEach((ss:any)=>{
      newColumn = {
        headerName: this.func.capital(ss) + " Servicio" ,
        field: `servicio_${ss}`, 
        headerClass: ['th-center', 'th-normal'],
        maxWidth: 100,
        cellRenderer: this.renderServicios
      };
      currentColumnDefs.push(newColumn)
    })
    this.gridApi?.setGridOption('columnDefs', currentColumnDefs);
    this.gridApi!.autoSizeAllColumns();

    this.refreshAll();

    // setTimeout(()=>{
    this.startMonitor();
    // },800)
  }

  dataGridStruct() {
    let that = this;
    this.gridOptions = {
      rowData: [],
      pagination: false,
      paginationPageSize: 50,
      paginationPageSizeSelector: [5, 10, 50, 100, 200, 300, 1000],
      // rowSelection: 'single',
      rowHeight: 35,
      groupHeaderHeight: 35,
      headerHeight: 55,
      defaultColDef: {
        minWidth: 90,
        filter: true,
        headerClass: 'bold',
        floatingFilter: false,
        resizable: false,
        sortable: true,
        wrapText: false,
        wrapHeaderText: true,
        suppressAutoSize: false,
        autoHeaderHeight: false,
        suppressSizeToFit: false,
        // autoHeight: true,
        cellDataType: 'text',
        flex: 1
      },

      skipHeaderOnAutoSize: true,
      onRowClicked: (event: any) => {
        this.id_selected = event.data.idservidor;
        this.server_select = event.data;
        this.is_deleted = event.data.deleted_at;
      },
      autoSizeStrategy: {
        type: 'fitCellContents',
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
          headerClass: 'th-normal',
          field: 'nombre',
          cellClass: 'text-start',
          filter: true,
          cellRenderer: this.renderAccionNombre.bind(this),
          pinned: 'left',
          minWidth: 200,
        },
        {
          headerName: 'Host',
          headerClass: 'th-normal',
          field: 'ip',
          cellClass: 'text-start',
          filter: true,
          cellRenderer: (params: ICellRendererParams) => {
            let ip = params.value;
            let host = params.data.host;
            let data = "";
            if (ip){
              if (ip.indexOf("|")>-1 && ip.indexOf(":")==-1){
                data = ip.split("|")[1];
                if (ip.split("|")[0]!="OK"){
                  data = host;
                }
              }else{
                data = host;
              }
            }else{
              data = host;
            }
            return data
          }
        },
        {
          headerName: 'Sentinel',
          // headerStyle: { color: "black", backgroundColor: "Gainsboro" },
          headerClass: ['th-center', 'th-normal'],
          field: 'healthy_agente',
          cellClass: 'text-start',
          cellRenderer: (params: ICellRendererParams) => {
            let data = params.data;
            let dato = params.value;
            let host = data.host;
            let puerto = data.agente_puerto ?? 'Sin Asignar';
            let text = '';
            let icono = 'far fa-times-circle  t16';
            let color = 'text-danger';

            if (!['', '-', '1', 'x'].includes(dato)) {
              let d = dato.split('|');
              if (d[0] == 'OK') {
                color = 'text-success';
                icono = 'far fa-check-circle t16';
              } else {
                color = 'text-danger';
                icono = 'far fa-times-circle t16';
              }
              text = '';
            } else if (dato == '1') {
              icono = 'fas fa-spinner fa-spin ';
              text = 'Revisando';
              color = 'text-primary';
            } else if (dato == '-') {
              icono = 'fas fa-minus-circle t16';
              text = '';
              color = 'text-secondary';
            }
            return `<span class="${color}"><i role="img" class='${icono}'></i> ${puerto} ${text}</span>`;
          },
        },
        {
          headerName: 'Tiempo Activo',
          // headerStyle: { color: "black", backgroundColor: "Gainsboro" },
          headerClass: ['th-center', 'th-normal'],
          field: 'uptime',
          filter: true,
          cellClass: 'text-start',
          minWidth: 100,
          cellRenderer: (params: ICellRendererParams) => {
            let dato = params.value;
            let text = '';
            let icono = '';
            let color = '';
            if (!['', '-', '1', 'x'].includes(dato)) {
              let d = dato.split('|');
              // if (d[0] == 'OK') {
              //   color = '';
              // } else {
              //   color = 'text-danger';
              // }
              text = dato
              // let st = d[1].trim().split(':');
              // text = `${st[0]}d ${st[1]}h${st[2]}m${st[3]}s`;
              // icono = 'far fa-clock t16';
              icono = '';
            } else if (dato == '1') {
              icono = 'fas fa-spinner fa-spin';
              text = 'Revisando';
              color = 'text-primary';
            } else if (dato == '-') {
              icono = 'fas fa-minus-circle t16';
              text = '';
              color = 'text-secondary';
            }
            return `<span class="${color}"><i role="img" class='${icono}'></i> ${text}</span>`;
          },
        },
        {
          headerName: 'Disco %',
          headerClass: ['th-center', 'th-normal'],
          field: 'disco',
          cellClass: 'text-start',
          minWidth: 100,
          cellRenderer: (params: ICellRendererParams) => {
            let porc:number = 0;
            let dato = params.value;
            let color = '';
            if (dato!="-"){
              porc = parseFloat(dato);
              if (isNaN(porc)) porc = 0;
              dato = this.func.numberFormat(porc,2);
              switch (true){
                case porc >= 0 && porc <=30:
                  color = "bg-light";
                  break;
                case porc >=31 && porc <=60:
                  color = "bg-info";
                  break;
                case porc >=61 && porc <=90:
                  color = "bg-warning";
                  break;
                case porc >=91 && porc <=100:
                  color = "bg-danger";
                  break;
              }
              color = "bg-success";
            }
            return `<kbd class="${color} p-2">${dato} %</kbd>`;
          },
        },
        {
          headerName: 'CPU %',
          headerClass: ['th-center', 'th-normal'],
          field: 'cpu_usado',
          cellClass: 'text-start',
          minWidth: 100,
          cellRenderer: (params: ICellRendererParams) => {
            let porc:number = 0;
            let dato = params.value;
            if (dato === undefined) dato = "100";
            let color = "";
            if (dato){
              porc = 100 - parseFloat(dato);
              dato = this.func.numberFormat(porc,2);
              if (isNaN(porc)) porc = 0;
              switch (true){
                case porc >= 0 && porc <=30:
                  color = "bg-success";
                  break;
                case porc >= 31 && porc <=60:
                  color = "bg-info";
                  break;
                case porc >= 61 && porc <=90:
                  color = "bg-warning";
                  break;
                case porc >= 91 && porc <=100:
                  color = "bg-danger";
                  break;
              }
            }
            return `<kbd class="${color} p-2">${dato} %</kbd>`;
          },
        },
        {
          headerName: 'RAM %',
          headerClass: ['th-center', 'th-normal'],
          field: 'memoria',
          cellClass: 'text-start',
          cellRenderer: (params: ICellRendererParams) => {
            let porc:number = 0;
            let dato = params.value;
            let color = '';
            porc = parseFloat(dato);
            if (isNaN(porc)) porc = 0;
            dato = this.func.numberFormat(porc,2);
            switch (true){
              case porc > 0 && porc <=30:
                color = "bg-success";
                break;
              case porc > 31 && porc <=60:
                color = "bg-info";
                break;
              case porc > 61 && porc <=90:
                color = "bg-warning";
                break;
              case porc > 91 && porc <=100:
                color = "bg-danger";
                break;
            }
            return `<kbd class="${color} p-2">${dato} %</kbd>`;
          },
        },
        {
          headerName: 'Terminal Servicio',
          headerClass: ['th-center', 'th-normal'],
          field: 'servicio_terminal',
          cellClass: 'text-start',
          minWidth: 100,
          cellRenderer: this.renderServicios
        },
        {
          headerName: 'Sentinel Servicio',
          headerClass: ['th-center', 'th-normal'],
          field: 'servicio_sentinel',
          cellClass: 'text-start',
          minWidth: 100,
          cellRenderer: this.renderServicios
        },
        
      ],
    };

    this.lstServidores.forEach(s=>{
      s.servicios.spli(",").forEach((ss:any)=>{
        this.gridOptions.columnDefs?.push({
          headerName: this.func.capital(ss),
          headerClass: ['th-center', 'th-normal'],
          field: `servicio_${ss}`,
          cellClass: 'text-start',
          minWidth: 100,
        })
      })
    })

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
    this.gridApi!.autoSizeAllColumns();
  }

  renderAccionNombre(params: ICellRendererParams) {
    let data = params.data;
    let nombre = data.nombre;
    this.id_selected = data.idservidor;
    this.server_select = data;

    const button = document.createElement('button');
    button.className = 'btn btn-white';
    button.innerHTML = `<span class="link" title='Mas Info'>${nombre}</span>`;
    button.addEventListener('click', () => {
      this.btnModal?.nativeElement.click();
    });
    return button;
  }

  renderServicios(params: ICellRendererParams) {
    let dato = params.value;
    if (dato == undefined) dato = "";
    let text = '';
    let icono = '';
    let color = 'text-dark';

    // console.log(`→${dato}←`)

    if (dato == 'active') {
      color = 'text-success';
      icono = 'far fa-check-circle t16';
    }else if (dato == 'inactive') {
      color = 'text-danger';
      icono = 'far fa-times-circle t16';
    }else{
      // icono = 'far fa-times-circle t16';
      // color = 'text-danger';
    }
    // if (!['', '-', '1', 'x', undefined].includes(dato)) {
    //   let d = dato.split('|');
    //   if (d[0] == 'OK') {
    //     if (d[1].trim() == 'active') {
    //       color = 'text-success';
    //       icono = 'far fa-check-circle t16';
    //     }else{
    //       icono = 'far fa-times-circle t16';
    //       color = 'text-danger';
    //     }
    //   } else {
    //     icono = 'far fa-times-circle t16';
    //     color = 'text-danger';
    //   }
    //   text = d[1];
    // } else if (dato == '1') {
    //   icono = 'fas fa-spinner fa-spin';
    //   text = 'Revisando';
    //   color = 'text-primary';
    // } else if (dato == '-' || dato !== undefined) {
    //   icono = 'fas fa-minus-circle t16';
    //   text = '';
    //   color = 'text-secondary';
    // }
    
    return `<span class="${color}"><i role="img" class='${icono}'></i> ${dato}</span>`;
  }

  timerGeneral() {
    let time = 0;
    this.tmrMonitor = setInterval(() => {
      this.monitoreo_esta_activo = true;
      if (this.continuar) {
        time++;
        if (time == this.tiempo_refresco) {
          this.sendMonitor();
          time = 0;
        } else {
          this.tiempo_restante = this.tiempo_refresco - time;
        }
      }
    }, 1000);
  }

  startMonitor() {
    this.serverIndex = 0;
    this.sendMonitor();
    this.timerGeneral();
  }

  stopMonitor() {
    this.monitoreo_esta_activo = false;
    this.revisando = '';
    this.serverIndex = 0;
    this.continuar = false;
    this.ws = null;
    clearInterval(this.tmrMonitor);
  }

  unaSolaVez() {
    this.serverIndex = 0;
    this.sendMonitor();
  }

  sendMonitor() {
    if (this.serverIndex == this.lstServidores.length) {
      this.serverIndex = 0;
      this.revisando = '';
      this.continuar = true;
    } else {
      this.continuar = false;
      this.openWS(this.lstServidores[this.serverIndex]);
    }
  }

  verificaServer(server: any) {
    if (server.healthy_agente.split('|')[0] == 'OK') {
      this.lstServidores.forEach((s) => {
        if (s.idservidor == server.idservidor) {
          s.healthy_agente = server.healthy_agente;
          this.refreshAll();
          return;
        }
      });
      this.enviaStats(server);
    } else if (server.healthy_agente.split('|')[0] == 'FAIL') {
      this.lstServidores.forEach((s) => {
        if (s.idservidor == server.idservidor) {
          s.healthy_agente = 'x';
          s.uptime = 'x';
          s.cpu = 'x';
          s.memoria = 'x';
          s.disco = 'x';
          s.servicio_httpd = 'x';
          s.servicio_ssh = 'x';
          s.host = 'localhost';
          s.servicio_terminal = 'x';
          this.refreshAll();
          return;
        }
      });
    }
  }

  enviaStats(server: any) {
    let param = {
      action: 'comando',
      identificador: {
        idcliente: this.user.idcliente,
        idusuario: this.user.idusuario,
        idservidor: server.idservidor,
        usuario: this.user.usuario,
        id:
          Math.floor(
            Math.random() * (9999999999999999 - 1000000000000000 + 1)
          ) + 1000000000000000,
      },
      data: [
        {"id": "top", "cmd":"top -b -n1 -em"},
        {"id": "disco", "cmd":" df -hT | grep -E 'ext4|xfs|btrfs' | awk '{print $3, $4, $5, $6}'"},
        // {"id": "ip", "cmd":`hostname -i`},
        {"id": "ip", "cmd":`ip route | column -t | awk '{print $1","$2","$3","$4","$5","$6","$7","$8","$9}'`},
        {"id": "release", "cmd":`cat /etc/os-release`},
        {"id": "cpuinfo", "cmd":`cat /proc/cpuinfo`},

        // {"id": "disco", "cmd":" df -hT | grep -E 'ext4|xfs|btrfs' | awk '{print $3, $4, $5}'"},
        // {"id": "cpu", "cmd":"cat /proc/loadavg | awk '{print $1, $2, $3}'"},
        // {"id": "cpu_usado", "cmd":`sar -u | grep '^[0-9]' | awk '{sum+=$3; count++} END {if(count>0) print sum/count}'`},
        // {"id": "memoria", "cmd":"free -h | grep -E 'Mem' | awk '{print $2, $3, $4}'"},
        // {"id": "uptime", "cmd":'sec=$(( $(date +%s) - $(date -d "$(ps -p 1 -o lstart=)" +%s) )); d=$((sec/86400)); h=$(( (sec%86400)/3600 )); m=$(( (sec%3600)/60 )); s=$((sec%60)); printf "%02d:%02d:%02d:%02d\n" $d $h $m $s'},
        {"id": "servicio_sentinel", "cmd":"systemctl is-active sentinel"},
        {"id": "servicio_terminal", "cmd":"systemctl is-active webssh2"},
        // {"id": "ip", "cmd":`hostname -i`},
      ],
    };

    if (server.servicios && server.servicios!=""){
      let arrS = server.servicios.split(",");
      arrS.forEach( (ss:any) => {
        param.data.push({"id": `servicio_${ss}`, "cmd":`systemctl is-active ${ss}`},)
      });
    }
    // console.log(`Servidor ${server.idservidor} data = ${param.data.length}`)
    console.log('↑ Enviando');
    // console.log(param);
    this.ws.send(JSON.stringify(param));
  }

  openWS(server: any) {
    const token = this.sessions.get('token');
    this.revisando = `${server.nombre}`;
    // console.log(this.revisando)
    let url = `ws://${server.host}:${server.agente_puerto}/ws?token=${token}`;
    let accion = false;
    try {
      if (!this.connection.has(server.idservidor)){
        accion = true
      }else{
        if (this.connection_status.get(server.idservidor) == "" || this.connection_status.get(server.idservidor) == "Desconectado"){
          accion = true;
        }
      }
      // console.log("Accion", accion)
      // console.log("Estado WS", this.connection_status.get(server.idservidor))
      if (accion){
        // console.log("NUEVO")
        this.ws = new WebSocket(url);
        this.connection.set(server.idservidor, this.ws)
        this.connection_status.set(server.idservidor, "");
        
        this.ws.onopen = (event: any) => this.onOpenListener(event, server);
        this.ws.onmessage = (event: any) => this.onMessageListener(event, server);
        this.ws.onclose = (event: any) => this.onCloseListener(event, server);
        this.ws.onerror = (event: any) => this.onErrorListener(event, server);
      }else{
        // console.log("USADO")
        this.ws = this.connection.get(server.idservidor);
        this.verificaServer(server);
      }
    } catch (ex) {
      console.log("♫", ex)
    }
  }

  onOpenListener(event: any, server: any) {
    let status = '';
    if (event.type == 'open') {
      console.log(`√ Conectado ${server.idservidor}`);
      this.connection_status.set(server.idservidor, "Conectado");
      server.healthy_agente = 'OK|Conectado';
    } else {
      console.log(`X Desconectado ${server.idservidor}`);
      this.connection_status.set(server.idservidor, "Desconectado");
      server.healthy_agente = 'FAIL|Desconectado';
    }
    this.verificaServer(server);
  }

  onMessageListener(e: any, server: any) {
    this.loadMonitoreo = true;
    console.log(`√ LlegoMensaje ${server.idservidor}`);
    let data = JSON.parse(e.data);
    let identificador = data.identificador;
    let r = "";
    let drep:any;
    let daux:any;
    data.data.forEach((d:any)=>{
      r = atob(d.respuesta);
      switch (d.id) {
        case "top":
          
          let datatop = r.split("\n");
          datatop.forEach((dt:any, idx:any)=>{
            switch(idx){
              case 0: //top
                drep = dt.replace(/,/g,"");
                daux = drep.replace(/-/g,"").split(" ");
                // console.log(daux)
                // this.lstDatos.hora = daux[2]; //hora
                this.buscaServidor(identificador.idservidor,"uptime", daux[4]+ " " + daux[5]) //uptime
                // this.lstDatos.cpu.t1 = daux[12]; //T1
                // this.lstDatos.cpu.t5 = daux[13]; //T1
                // this.lstDatos.cpu.t15 = daux[14]; //T1
                // this.graphCPU(daux[12], daux[13], daux[14]);
                break;
              case 1: // Tasks
                drep = dt.replace(/,/g,"");
                daux = drep.replace(/-/g,"").split(" ");
                this.buscaServidor(identificador.idservidor,"tareas", {
                  total: daux[2],
                  running: daux[6],
                  sleeping: daux[9],
                  stopped: daux[13],
                  zombie: daux[17],
                })
                break;
              case 2: // %CPU
                dt = dt.replace("%Cpu(s): ", "");
                dt = dt.replace(/ /g, "");
                dt = dt.replace("us,", "|");
                dt = dt.replace("sy,", "|");
                dt = dt.replace("ni,", "|");
                dt = dt.replace("id,", "|");
                dt = dt.replace("wa,", "|");
                dt = dt.replace("hi,", "|");
                dt = dt.replace("si,", "|");
                dt = dt.replace("st", "|");
                daux = dt.split("|");
                drep = daux[3].replace(",",".");
                // console.log(identificador.idservidor, drep)
                this.buscaServidor(identificador.idservidor,"cpu_usado", drep) 
                break;
              case 3: //MIB MEM
                  daux = dt.replace("MiB Mem :  ", "");
                  daux = daux.replace("total", "");
                  daux = daux.replace("free", "");
                  daux = daux.replace("used", "");
                  daux = daux.replace("buff/cache", "");
                  daux = daux.replace(/\ /g, "");
                  drep = daux.split(",");
                  this.buscaServidor(identificador.idservidor,"memoria",this.func.numberFormat( (   (parseFloat(drep[2]) / parseFloat(drep[0]))*100  ),2));
                  // this.lstDatos.memoria.total = drep[0]; 
                  // this.lstDatos.memoria.usado = drep[2]; 
                  // this.lstDatos.memoria.libre = drep[1]; 
                  // this.lstDatos.memoria.porcentaje = this.func.numberFormat( (   (parseFloat(drep[2]) / parseFloat(drep[0]))*100  ),2); 
                //  console.log(drep);
                break;
              case 4: // Swap
                break;
              case 5: //vacio
                break;
              case 6: //Tituloprocesos
                break;
              default: //Procesos
                daux = dt.split(" ");
                drep = [];
                daux.forEach((d:any)=>{
                  if (d.trim() != ""){
                    drep.push(d)
                  }
                })
                if (drep.length>0){
                  let command = drep.slice(11, 15).join(" ");
                  // this.lstDatos.procesos.push({
                  //   "PID" : drep[0],
                  //   "USER" : drep[1],
                  //   "PR" : drep[2],
                  //   "NI" : drep[3],
                  //   "VIRT" : drep[4],
                  //   "RES" : drep[5],
                  //   "SHR" : drep[6],
                  //   "S" : drep[7],
                  //   "CPU" : parseFloat(drep[8]),
                  //   "MEM" : parseFloat(drep[9]),
                  //   "TIME" : drep[10],
                  //   "COMMAND" : command
                  // })
                }
                break;

            }
          })
          break;
        case "disco":
          // this.lstDatos.disco.total = r[0];
          // this.lstDatos.disco.usado = r[1];
          // this.lstDatos.disco.libre = r[2];
          // this.lstDatos.disco.porcentaje = r[3]
          daux = r.split(" ");
          drep = daux[3].replace("%", "");
          this.buscaServidor(identificador.idservidor,"disco",drep);
          break;
        case "ip":
          daux = r.split("\n");
          drep =  daux[1].split(",")[8];
          this.buscaServidor(identificador.idservidor,"host",drep);
          break;
        case "release":
          daux = r.split("\n");
          // daux = r.replace(/\n/g, "<br>");
          this.buscaServidor(identificador.idservidor,"release",daux);
          break;
        case "cpuinfo":
          daux = r.split("\n");
          // daux = r.replace(/\n/g, "<br>");
          this.buscaServidor(identificador.idservidor,"cpuinfo",daux);
          break;
        default:
          if (d.id.indexOf("servicio") >-1 ){
            this.buscaServidor(identificador.idservidor, d.id, r.replace("\n", ""));
          }
          break
      }
    });

    this.refreshAll();
    setTimeout(() => {
      this.loadMonitoreo = false;
    }, 500);

    this.serverIndex++;
    this.sendMonitor();
  }


  buscaServidor(idservidor:any, field:any, value:any){
    this.lstServidores.forEach((s: any) => {
      // console.log(s.idservidor, idservidor, s.idservidor == idservidor)
      if (s.idservidor == idservidor) {
        s[field] = value
      }
    });
  }

  onCloseListener(event: any, server: any) {
    // console.log('onCloseListener', event);
    if (event.code != 1000) {
      this.connection_status.set(server.idservidor, "Desconectado");
      console.log(`X Desconectado ${server.idservidor}`);
      server.healthy_agente = 'FAIL|Desconectado';
      this.verificaServer(server);
      this.serverIndex++;
      try {
        this.sendMonitor();
      } catch (err) {}
    } else{
      console.log(`X Desconectado manualmente ${server.idservidor}`);
    }
  }

  onErrorListener(event: any, server: any) {}

  exportarPDF() {
    let data: any = this.prepareToExport();
    let params = {
      orientation: 'l',
      titulo: 'Monitoreo',
      data: data,
      filename: `lisah_monitor_servidores${moment().format(
        'YYYYMMDDHHmmss'
      )}.pdf`,
    };
    this.func.exportarPDF(params);
  }

  exportarCSV() {
    let data: any = this.prepareToExport();
    this.func.exportarCSV(
      data,
      `lisah_monitor_servidores${moment().format('YYYYMMDDHHmmss')}.csv`
    );
  }

  prepareToExport(): Array<any> {
    let arr: any = [];
    this.lstServidores.forEach((d: any) => {
      try {
        let dat:any = {
          servidor: d.nombre,
          host: d.host,
          // ubicacion: d.ubicacion,
          // agente_puerto: d.agente_puerto,
          // ssh_puerto: d.ssh_puerto,
          // terminal_puerto: d.terminal_puerto,
          disco: d.disco + "%",
          memoria: d.memoria + "%",
          cpu: d.cpu_usado + "%",
          sentinel: this.func.capital(d.servicio_terminal.replace("OK|","")),
          terminal: this.func.capital(d.servicio_sentinel.replace("OK|","")),
          // memoria: d.memoria.split("|")[1],
          // cpu: d.cpu.split("|")[1],
        }

        this.arrServicios.forEach((s:any)=>{
            dat[s] = "";
        })

        if (d.servicios && d.servicios!=""){
          let serv = d.servicios.split(",");
          serv.forEach((s:any)=>{
            dat[s] = this.func.capital(d["servicio_" + s].replace("OK|",""));
          })
        }

        // dat.estado = d.estado == 1 ? 'Activo' : 'Inactivo';
        
        arr.push(dat);
      } catch (err) {
        console.log(err, d);
      }
    });
    return arr;
  }
}
