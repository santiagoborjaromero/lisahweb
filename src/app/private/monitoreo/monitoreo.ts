import { Component, inject } from '@angular/core';
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
  private readonly userSvc = inject(UsuarioService);
  private readonly serverSvc = inject(ServidorService);
  private readonly generalSvc = inject(GeneralService);
  private readonly func = inject(Functions);
  private readonly sessions = inject(Sessions);
  private readonly wsSvc = inject(SentinelService);

  aqui: any | undefined;

  private server = new Map<number, any>();

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
      { nombre: 'Monitoreo', ruta: 'admin/monitoreo' },
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
    this.getUsuario();
    setTimeout(()=>{
      this.startMonitor();
    },800)
  }

  ngOnDestroy(): void {
    this.stopMonitor();
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
          if (resp.data[0].servidores && resp.data[0].servidores.length > 0) {
            resp.data[0].servidores.forEach((s: any) => {
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
              this.lstServidores.push(s);
            });
            
            // this.dataGridStruct();
            const currentColumnDefs:any = this.gridApi?.getGridOption('columnDefs');
            let newColumn:any;
            this.arrServicios.forEach((ss:any)=>{
              console.log(ss)
              newColumn = {
                headerName: this.func.capital(ss) + " Servicio" ,
                field: `servicio_${ss}`, 
                headerClass: ['th-center', 'th-normal'],
                maxWidth: 100,
                cellRenderer: this.renderServicios
              };
              currentColumnDefs.push(newColumn)
              // updatedColumnDefs = [...currentColumnDefs, newColumn];
            })
            // this.gridApi?.setGridOption('columnDefs', updatedColumnDefs);
            this.gridApi?.setGridOption('columnDefs', currentColumnDefs);
            this.gridApi!.autoSizeAllColumns();
          }
          // console.log(this.lstServidores)
        } else {
          this.func.showMessage('error', 'Usuario', resp.message);
        }
        // setTimeout(()=>{
        this.refreshAll();
        // },1000)
      },
      error: (err: any) => {
        this.func.closeSwal();
        this.func.handleErrors('Usuario', err);
      },
    });
  }

  procesarDato(dato:any){
    // console.log("dato", dato)
    let d = dato.split('|');
    let color:any;
    let icono:any;
    let text:any;
    let porc:any;

    if (d[0] == 'OK') {
      color = '';
    } else {
      color = 'text-danger';
    }
    icono = '';
    text = d[1].split(' ');
    let total = parseFloat(text[0].replace("G","").replace("Gi",""));
    let usado = parseFloat(text[1].replace("G","").replace("Gi",""));
    let libre = parseFloat(text[2].replace("G","").replace("Gi",""));
    porc = parseFloat(this.func.numberFormat((usado / total) * 100,2));

    return {color, icono, text, porc}
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
              if (ip.indexOf("|")>-1){
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
          headerName: 'UpTime',
          // headerStyle: { color: "black", backgroundColor: "Gainsboro" },
          headerClass: ['th-center', 'th-normal'],
          field: 'uptime',
          filter: true,
          cellClass: 'text-start',
          cellRenderer: (params: ICellRendererParams) => {
            let dato = params.value;
            let text = '';
            let icono = 'far fa-times-circle t16';
            let color = 'text-danger';
            if (!['', '-', '1', 'x'].includes(dato)) {
              let d = dato.split('|');
              if (d[0] == 'OK') {
                color = '';
              } else {
                color = 'text-danger';
              }
              let st = d[1].trim().split(':');
              text = `${st[0]}d ${st[1]}h${st[2]}m${st[3]}s`;
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
          // headerStyle: { color: "black", backgroundColor: "white" },
          headerClass: ['th-center', 'th-normal'],
          field: 'disco',
          cellClass: 'text-start',
          cellRenderer: (params: ICellRendererParams) => {
            let porc:number = 0;
            let dato = params.data.disco;
            let text:any;
            let icono = 'far fa-times-circle t16';
            let color = 'text-danger';
            if (!['', '-', '1', 'x'].includes(dato)) {
              let f = this.procesarDato(dato);
              color = f.color;
              icono = f.icono;
              text = f.text;
              porc = f.porc;
              // text = text.replace(/^\/S+$/, ",")
              switch (true){
                case porc > 0 && porc <=30:
                  color = "bg-light";
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
              color = "bg-success";
            } else if (dato == '1') {
              icono = 'fas fa-spinner fa-spin';
              text = 'Revisando';
              color = 'text-primary';
            } else if (dato == '-') {
              icono = 'fas fa-minus-circle t16';
              text = '';
              color = 'text-secondary';
            }
            return `<kbd class="${color} p-2">${porc} %</kbd>`;
          },
        },
        {
          headerName: 'CPU %',
          // headerStyle: { color: "black", backgroundColor: "white" },
          headerClass: ['th-center', 'th-normal'],
          field: 'cpu_usado',
          cellClass: 'text-start',
          cellRenderer: (params: ICellRendererParams) => {
            let porc:number = 0;
            let dato = params.data.cpu_usado;
            let color = "bg-light text-dark";

            if (dato){
              porc = parseFloat(this.func.numberFormat(parseFloat(dato.split("|")[1]),2));
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
            }
            return `<kbd class="${color} p-2">${porc} %</kbd>`;
          },
        },
        {
          headerName: 'RAM %',
          // headerStyle: { color: "black", backgroundColor: "white" },
          headerClass: ['th-center', 'th-normal'],
          field: 'memoria',
          cellClass: 'text-start',
          cellRenderer: (params: ICellRendererParams) => {
            let porc:number = 0;
            let dato = params.data.memoria;
            let text:any;
            let icono = 'far fa-times-circle t16';
            let color = 'text-danger';
            if (!['', '-', '1', 'x'].includes(dato)) {
              // let d = dato.split('|');
              // if (d[0] == 'OK') {
              //   color = '';
              // } else {
              //   color = 'text-danger';
              // }
              // icono = '';
              // text = d[1].replace('/', '');
              // text = text.replace('/', '-');
              // text = text.split(' ');
              // let total = parseFloat(text[0].replace("Gi",""));
              // let usado = parseFloat(text[1].replace("Gi",""));
              // let libre = parseFloat(text[2].replace("Gi",""));
              let f = this.procesarDato(dato);
              color = f.color;
              icono = f.icono;
              text = f.text;
              porc = f.porc;
              // porc = parseFloat(this.func.numberFormat((usado / total) * 100,2));

              // text = text.replace(/^\/S+$/, ",")
              switch (true){
                case porc > 0 && porc <=30:
                  color = "bg-light";
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
              color = "bg-success";
            } else if (dato == '1') {
              icono = 'fas fa-spinner fa-spin';
              text = 'Revisando';
              color = 'text-primary';
            } else if (dato == '-') {
              icono = 'fas fa-minus-circle t16';
              text = '';
              color = 'text-secondary';
            }
            return `<kbd class="${color} p-2">${porc} %</kbd>`;
          },
        },


        // {
        //   headerName: 'Disco',
        //   // headerStyle: { color: "white", backgroundColor: "CadetBlue" },
        //   headerClass: ['th-center', 'th-grupo1'],
        //   children: [
        //     {
        //       headerName: 'Total',
        //       // headerStyle: { color: "black", backgroundColor: "white" },
        //       headerClass: ['th-center', 'th-normal'],
        //       field: 'disco',
        //       cellClass: 'text-start',
        //       cellRenderer: (params: ICellRendererParams) => {
        //         let dato = params.data.disco;
        //         let text = '';
        //         let icono = 'far fa-times-circle t16';
        //         let color = 'text-danger';
        //         if (!['', '-', '1', 'x'].includes(dato)) {
        //           let d = dato.split('|');
        //           if (d[0] == 'OK') {
        //             color = '';
        //           } else {
        //             color = 'text-danger';
        //           }
        //           // icono = 'fas fa-sd-card t16';
        //           icono = '';
        //           text = d[1].replace('/', '');
        //           text = text.replace('/', '-');
        //           text = text.split(' ')[0];
        //           // text = text.replace(/^\/S+$/, ",")
        //         } else if (dato == '1') {
        //           icono = 'fas fa-spinner fa-spin';
        //           text = 'Revisando';
        //           color = 'text-primary';
        //         } else if (dato == '-') {
        //           icono = 'fas fa-minus-circle t16';
        //           text = '';
        //           color = 'text-secondary';
        //         }
        //         return `<span class="${color}"><i role="img" class='${icono}'></i> ${text}</span>`;
        //       },
        //     },
        //     {
        //       headerName: 'Usado',
        //       headerClass: ['th-center', 'th-normal'],
        //       field: 'disco',
        //       cellClass: 'text-start',
        //       cellRenderer: (params: ICellRendererParams) => {
        //         let dato = params.data.disco;
        //         let text = '';
        //         let icono = 'far fa-times-circle t16';
        //         let color = 'text-danger';
        //         if (!['', '-', '1', 'x'].includes(dato)) {
        //           let d = dato.split('|');
        //           if (d[0] == 'OK') {
        //             color = '';
        //           } else {
        //             color = 'text-danger';
        //           }
        //           // icono = 'fas fa-sd-card t16';
        //           icono = '';
        //           text = d[1].replace('/', '');
        //           text = text.replace('/', '-');
        //           text = text.split(' ')[1];
        //           // text = text.replace(/^\/S+$/, ",")
        //         } else if (dato == '1') {
        //           icono = 'fas fa-spinner fa-spin';
        //           text = 'Revisando';
        //           color = 'text-primary';
        //         } else if (dato == '-') {
        //           icono = 'fas fa-minus-circle t16';
        //           text = '';
        //           color = 'text-secondary';
        //         }
        //         return `<span class="${color}"><i role="img" class='${icono}'></i> ${text}</span>`;
        //       },
        //     },
        //     {
        //       headerName: 'Libre',
        //       headerClass: ['th-center', 'th-normal'],
        //       field: 'disco',
        //       cellClass: 'text-start',
        //       cellRenderer: (params: ICellRendererParams) => {
        //         let dato = params.data.disco;
        //         let text = '';
        //         let icono = 'far fa-times-circle t16';
        //         let color = 'text-danger';
        //         if (!['', '-', '1', 'x'].includes(dato)) {
        //           let d = dato.split('|');
        //           if (d[0] == 'OK') {
        //             color = '';
        //           } else {
        //             color = 'text-danger';
        //           }
        //           // icono = 'fas fa-sd-card t16';
        //           icono = '';
        //           text = d[1].replace('/', '');
        //           text = text.replace('/', '-');
        //           text = text.split(' ')[2];
        //           // text = text.replace(/^\/S+$/, ",")
        //         } else if (dato == '1') {
        //           icono = 'fas fa-spinner fa-spin';
        //           text = 'Revisando';
        //           color = 'text-primary';
        //         } else if (dato == '-') {
        //           icono = 'fas fa-minus-circle t16';
        //           text = '';
        //           color = 'text-secondary';
        //         }
        //         return `<span class="${color}"><i role="img" class='${icono}'></i> ${text}</span>`;
        //       },
        //     },
        //   ],
        // },
        // {
        //   headerName: 'Load / CPU',
        //   // headerStyle: { color: "white", backgroundColor: "DarkCyan" },
        //   headerClass: ['th-center', 'th-normal'],
        //   children: [
        //     {
        //       headerName: '1 min',
        //       // headerStyle: { color: "black", backgroundColor: "Gainsboro" },
        //       headerClass: ['th-center', 'th-normal'],
        //       field: 'cpu',
        //       cellClass: 'text-start',
        //       cellRenderer: (params: ICellRendererParams) => {
        //         let dato = params.value;
        //         let text = '';
        //         let icono = 'far fa-times-circle t16';
        //         let color = 'text-danger';
        //         if (!['', '-', '1', 'x'].includes(dato)) {
        //           let d = dato.split('|');
        //           if (d[0] == 'OK') {
        //             color = '';
        //           } else {
        //             color = 'text-danger';
        //           }
        //           // icono = 'fas fa-microchip t16';
        //           icono = '';
        //           text = d[1].split(' ')[0];
        //         } else if (dato == '1') {
        //           icono = 'fas fa-spinner fa-spin';
        //           text = 'Revisando';
        //           color = 'text-primary';
        //         } else if (dato == '-') {
        //           icono = 'fas fa-minus-circle t16';
        //           text = '';
        //           color = 'text-secondary';
        //         }
        //         return `<span class="${color}"><i role="img" class='${icono}'></i> ${text}</span>`;
        //       },
        //     },
        //     {
        //       headerName: '5 mins',
        //       // headerStyle: { color: "black", backgroundColor: "white" },
        //       headerClass: ['th-center', 'th-normal'],
        //       field: 'cpu',
        //       cellClass: 'text-start',
        //       cellRenderer: (params: ICellRendererParams) => {
        //         let dato = params.value;
        //         let text = '';
        //         let icono = 'far fa-times-circle t16';
        //         let color = 'text-danger';
        //         if (!['', '-', '1', 'x'].includes(dato)) {
        //           let d = dato.split('|');
        //           if (d[0] == 'OK') {
        //             color = '';
        //           } else {
        //             color = 'text-danger';
        //           }
        //           // icono = 'fas fa-microchip t16';
        //           icono = '';
        //           text = d[1].split(' ')[1];
        //         } else if (dato == '1') {
        //           icono = 'fas fa-spinner fa-spin';
        //           text = 'Revisando';
        //           color = 'text-primary';
        //         } else if (dato == '-') {
        //           icono = 'fas fa-minus-circle t16';
        //           text = '';
        //           color = 'text-secondary';
        //         }
        //         return `<span class="${color}"><i role="img" class='${icono}'></i> ${text}</span>`;
        //       },
        //     },
        //     {
        //       headerName: '15 mins',
        //       headerClass: ['th-center', 'th-normal'],
        //       field: 'cpu',
        //       cellClass: 'text-start',
        //       cellRenderer: (params: ICellRendererParams) => {
        //         let dato = params.value;
        //         let text = '';
        //         let icono = 'far fa-times-circle t16';
        //         let color = 'text-danger';
        //         if (!['', '-', '1', 'x'].includes(dato)) {
        //           let d = dato.split('|');
        //           if (d[0] == 'OK') {
        //             color = '';
        //           } else {
        //             color = 'text-danger';
        //           }
        //           // icono = 'fas fa-microchip t16';
        //           icono = '';
        //           text = d[1].split(' ')[2];
        //         } else if (dato == '1') {
        //           icono = 'fas fa-spinner fa-spin';
        //           text = 'Revisando';
        //           color = 'text-primary';
        //         } else if (dato == '-') {
        //           icono = 'fas fa-minus-circle t16';
        //           text = '';
        //           color = 'text-secondary';
        //         }
        //         return `<span class="${color}"><i role="img" class='${icono}'></i> ${text}</span>`;
        //       },
        //     },
        //   ],
        // },
        // {
        //   headerName: 'Memoria',
        //   // headerStyle: { color: "white", backgroundColor: "CadetBlue" },
        //   headerClass: ['th-center', 'th-grupo1'],
        //   children: [
        //     {
        //       headerName: 'Total',
        //       headerClass: ['th-center', 'th-normal'],
        //       field: 'memoria',
        //       cellClass: 'text-start',
        //       cellRenderer: (params: ICellRendererParams) => {
        //         let dato = params.value;
        //         let text = '';
        //         let icono = 'far fa-times-circle t16';
        //         let color = 'text-danger';
        //         if (!['', '-', '1', 'x'].includes(dato)) {
        //           let d = dato.split('|');
        //           if (d[0] == 'OK') {
        //             color = '';
        //           } else {
        //             color = 'text-danger';
        //           }
        //           // icono = 'fas fa-memory t16';
        //           icono = '';
        //           text = d[1].split(' ')[0];
        //         } else if (dato == '1') {
        //           icono = 'fas fa-spinner fa-spin';
        //           text = 'Revisando';
        //           color = 'text-primary';
        //         } else if (dato == '-') {
        //           icono = 'fas fa-minus-circle t16';
        //           text = '';
        //           color = 'text-secondary';
        //         }
        //         return `<span class="${color}"><i role="img" class='${icono}'></i> ${text}</span>`;
        //       },
        //     },
        //     {
        //       headerName: 'Usado',
        //       headerClass: ['th-center', 'th-normal'],
        //       field: 'memoria',
        //       cellClass: 'text-start',
        //       cellRenderer: (params: ICellRendererParams) => {
        //         let dato = params.value;
        //         let text = '';
        //         let icono = 'far fa-times-circle t16';
        //         let color = 'text-danger';
        //         if (!['', '-', '1', 'x'].includes(dato)) {
        //           let d = dato.split('|');
        //           if (d[0] == 'OK') {
        //             color = '';
        //           } else {
        //             color = 'text-danger';
        //           }
        //           // icono = 'fas fa-memory t16';
        //           icono = '';
        //           text = d[1].split(' ')[1];
        //         } else if (dato == '1') {
        //           icono = 'fas fa-spinner fa-spin';
        //           text = 'Revisando';
        //           color = 'text-primary';
        //         } else if (dato == '-') {
        //           icono = 'fas fa-minus-circle t16';
        //           text = '';
        //           color = 'text-secondary';
        //         }
        //         return `<span class="${color}"><i role="img" class='${icono}'></i> ${text}</span>`;
        //       },
        //     },
        //     {
        //       headerName: 'Libre',
        //       headerClass: ['th-center', 'th-normal'],
        //       field: 'memoria',
        //       cellClass: 'text-start',
        //       cellRenderer: (params: ICellRendererParams) => {
        //         let dato = params.value;
        //         let text = '';
        //         let icono = 'far fa-times-circle t16';
        //         let color = 'text-danger';
        //         if (!['', '-', '1', 'x'].includes(dato)) {
        //           let d = dato.split('|');
        //           if (d[0] == 'OK') {
        //             color = '';
        //           } else {
        //             color = 'text-danger';
        //           }
        //           // icono = 'fas fa-memory t16';
        //           icono = '';
        //           text = d[1].split(' ')[2];
        //         } else if (dato == '1') {
        //           icono = 'fas fa-spinner fa-spin';
        //           text = 'Revisando';
        //           color = 'text-primary';
        //         } else if (dato == '-') {
        //           icono = 'fas fa-minus-circle t16';
        //           text = '';
        //           color = 'text-secondary';
        //         }
        //         return `<span class="${color}"><i role="img" class='${icono}'></i> ${text}</span>`;
        //       },
        //     },
        //   ],
        // },
        // {
        //   headerName: 'Servicios',
        //   headerStyle: { color: 'white', backgroundColor: 'SteelBlue' },
        //   children: [
            // {
            //   headerName: 'HTTPD',
            //   headerClass: ['th-center', 'th-normal'],
            //   field: 'servicio_httpd',
            //   cellClass: 'text-start',
            //   minWidth: 100,
            //   cellRenderer: (params: ICellRendererParams) => {
            //     let dato = params.value;
            //     let text = '';
            //     let icono = 'far fa-times-circle t16';
            //     let color = 'text-danger';
            //     if (!['', '-', '1', 'x'].includes(dato)) {
            //       let d = dato.split('|');
            //       if (d[0] == 'OK') {
            //         color = 'text-success';
            //         icono = 'far fa-check-circle t16';
            //       } else {
            //         color = 'text-danger';
            //         icono = 'far fa-times-circle t16';
            //       }
            //       text = d[1];
            //     } else if (dato == '1') {
            //       icono = 'fas fa-spinner fa-spin';
            //       text = 'Revisando';
            //       color = 'text-primary';
            //     } else if (dato == '-') {
            //       icono = 'fas fa-minus-circle t16';
            //       text = '';
            //       color = 'text-secondary';
            //     }
            //     return `<span class="${color}"><i role="img" class='${icono}'></i> ${text}</span>`;
            //   },
            // },
            // {
            //   headerName: 'SSH',
            //   headerClass: ['th-center', 'th-normal'],
            //   field: 'servicio_ssh',
            //   cellClass: 'text-start',
            //   minWidth: 100,
            //   cellRenderer: (params: ICellRendererParams) => {
            //     let dato = params.value;
            //     let text = '';
            //     let icono = 'far fa-times-circle t16';
            //     let color = 'text-danger';
            //     if (!['', '-', '1', 'x'].includes(dato)) {
            //       let d = dato.split('|');
            //       if (d[0] == 'OK') {
            //         color = 'text-success';
            //         icono = 'far fa-check-circle t16';
            //       } else {
            //         icono = 'far fa-times-circle t16';
            //         color = 'text-danger';
            //       }
            //       text = d[1];
            //     } else if (dato == '1') {
            //       icono = 'fas fa-spinner fa-spin';
            //       text = 'Revisando';
            //       color = 'text-primary';
            //     } else if (dato == '-') {
            //       icono = 'fas fa-minus-circle t16';
            //       text = '';
            //       color = 'text-secondary';
            //     }
            //     return `<span class="${color}"><i role="img" class='${icono}'></i> ${text}</span>`;
            //   },
            // },
          // },
        // ],
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

    const button = document.createElement('button');
    button.className = 'btn btn-white';
    button.innerHTML = `<span class="link" title='Editar'>${nombre}</span>`;
    button.addEventListener('click', () => {
      // this.funcEdit();
    });
    return button;
  }

  renderServicios(params: ICellRendererParams) {
    let dato = params.value;
    let text = '';
    let icono = '';
    let color = 'text-dark';
    if (!['', '-', '1', 'x', undefined].includes(dato)) {
      let d = dato.split('|');
      if (d[0] == 'OK') {
        if (d[1].trim() == 'active') {
          color = 'text-success';
          icono = 'far fa-check-circle t16';
        }else{
          icono = 'far fa-times-circle t16';
          color = 'text-danger';
        }
      } else {
        icono = 'far fa-times-circle t16';
        color = 'text-danger';
      }
      text = d[1];
    } else if (dato == '1') {
      icono = 'fas fa-spinner fa-spin';
      text = 'Revisando';
      color = 'text-primary';
    } else if (dato == '-' || dato !== undefined) {
      icono = 'fas fa-minus-circle t16';
      text = '';
      color = 'text-secondary';
    }
    return `<span class="${color}"><i role="img" class='${icono}'></i> ${text}</span>`;
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
    // console.log('Verificar Server', server.idservidor);
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
        {"id": "disco", "cmd":" df -hT | grep -E 'ext4|xfs|btrfs' | awk '{print $3, $4, $5}'"},
        {"id": "cpu", "cmd":"cat /proc/loadavg | awk '{print $1, $2, $3}'"},
        {"id": "cpu_usado", "cmd":`sar -u | grep '^[0-9]' | awk '{sum+=$3; count++} END {if(count>0) print sum/count}'`},
        {"id": "memoria", "cmd":"free -h | grep -E 'Mem' | awk '{print $2, $3, $4}'"},
        {"id": "uptime", "cmd":'sec=$(( $(date +%s) - $(date -d "$(ps -p 1 -o lstart=)" +%s) )); d=$((sec/86400)); h=$(( (sec%86400)/3600 )); m=$(( (sec%3600)/60 )); s=$((sec%60)); printf "%02d:%02d:%02d:%02d\n" $d $h $m $s'},
        {"id": "servicio_sentinel", "cmd":"systemctl is-active sentinel"},
        {"id": "servicio_terminal", "cmd":"systemctl is-active webssh2"},
        {"id": "ip", "cmd":`hostname -i`},
      ],
    };

    if (server.servicios && server.servicios!=""){
      let arrS = server.servicios.split(",");
      arrS.forEach( (ss:any) => {
        param.data.push({"id": `servicio_${ss}`, "cmd":`systemctl is-active ${ss}`},)
      });
    }

    console.log(`Servidor ${server.idservidor} data = ${param.data.length}`)

    console.log('↑ Enviando');
    // console.log(param);
    this.ws.send(JSON.stringify(param));
  }

  openWS(server: any) {
    const token = this.sessions.get('token');
    this.revisando = `${server.nombre}`;
    let url = `ws://${server.host}:${server.agente_puerto}/ws?token=${token}`;
    try {
      this.ws = new WebSocket(url);
      this.ws.onopen = (event: any) => this.onOpenListener(event, server);
      this.ws.onmessage = (event: any) => this.onMessageListener(event, server);
      this.ws.onclose = (event: any) => this.onCloseListener(event, server);
      this.ws.onerror = (event: any) => this.onErrorListener(event, server);
    } catch (ex) {
      // console.log(ex)
    }
  }

  onOpenListener(event: any, server: any) {
    let status = '';
    if (event.type == 'open') {
      console.log(`√ Conectado ${server.idservidor}`);
      server.healthy_agente = 'OK|Conectado';
    } else {
      console.log(`X Desconectado ${server.idservidor}`);
      server.healthy_agente = 'FAIL|Desconectado';
    }
    this.verificaServer(server);
  }

  onMessageListener(e: any, server: any) {
    this.loadMonitoreo = true;
    console.log(`√ LlegoMensaje ${server.idservidor}`);
    let data = JSON.parse(e.data);
    // console.log(data);
    switch (data.action) {
      case 'comando':
        let msg = '';
        this.lstServidores.forEach((s: any) => {
          if (s.idservidor == server.idservidor) {
            data.data.forEach((r: any) => {
              let respuesta: any = atob(r.respuesta);
              // console.log(respuesta);
              try {
                // if (respuesta.returncode == 0) {
                msg = `OK|${respuesta}`;
                // } else {
                //   msg = `FAIL|${respuesta.stderr}`;
                // }
                s[r.id] = msg;
              } catch (ex) {}
            });
          }
        });
        this.refreshAll();
        setTimeout(() => {
          this.loadMonitoreo = false;
        }, 500);

        this.ws.close(1000);
        this.ws = null;

        this.serverIndex++;
        this.sendMonitor();
        break;
    }
  }

  onCloseListener(event: any, server: any) {
    // console.log('onCloseListener', event);
    if (event.code != 1000) {
      console.log(`X Desconectado ${server.idservidor}`);
      server.healthy_agente = 'FAIL|Desconectado';
      this.verificaServer(server);
      this.serverIndex++;
      try {
        this.sendMonitor();
      } catch (err) {}
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
      let disco = this.procesarDato(d.disco);
      let memoria = this.procesarDato(d.memoria);

      try {
        let dat:any = {
          servidor: d.nombre,
          // host: d.host,
          // ubicacion: d.ubicacion,
          // agente_puerto: d.agente_puerto,
          // ssh_puerto: d.ssh_puerto,
          // terminal_puerto: d.terminal_puerto,
          disco: disco.porc + "%",
          memoria: memoria.porc + "%",
          cpu: this.func.numberFormat(parseFloat(d.cpu_usado.split("|")[1])) + "%",
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
