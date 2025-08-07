import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AllCommunityModule, ColumnAutosizeService, createGrid, GridApi, GridOptions, ICellRendererParams, ModuleRegistry} from 'ag-grid-community';
import { ServidorService } from '../../core/services/servidor.service';
import { Functions } from '../../core/helpers/functions.helper';
import { Sessions } from '../../core/helpers/session.helper';
import { UsuarioService } from '../../core/services/usuarios.service';
import moment from 'moment';

import { WSService } from '../../core/services/ws.service';
import { Titulo } from '../shared/titulo/titulo';
import { Path } from '../shared/path/path';
import { GeneralService } from '../../core/services/general.service';

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
    private readonly wsSvc = inject(WSService);
  
    aqui: any | undefined;
  
    // private webSockets = new Map<number, WebSocket>();
    private server = new Map<number, any>();
  
    user: any = null;
    path:any = [];
    titulo:any = {icono: "",nombre:""}
    canR: boolean = true;
    canW: boolean = true;
    canD: boolean = true;
  
    conteo:number = 0;
    public dtOptions: any = {};
    public gridOptions: GridOptions<any> = {};
    public gridApi?: GridApi<any>;
    public id_selected: string = '';
    public is_deleted: any = null;
  
    wsConn: any | undefined;
    lstServidores: Array<any> = [];
  
    playMonitor:boolean=false;
    funcionaAgente:boolean=false;
    tiempo_refresco:number = 0;

    tmrMonitor: any | undefined

    firstTime:boolean = true;
    loadMonitoreo:boolean = false;
  
    constructor() {
      // effect(() => {
      //   console.log("█", this.aqui)
      // });
    }
  
  
    ngOnInit(): void {
      this.user = JSON.parse(this.sessions.get('user'));
      this.path = [
        {nombre: "Admin & Hardening", ruta: ""}, 
        {nombre: "Monitoreo", ruta: "admin/monitoreo"}, 
      ];
    
      this.titulo = {icono: "fas fa-chart-bar",nombre: "Monitoreo"}
  
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
    }
  
    ngAfterViewInit(): void {
      this.dataGridStruct();
      this.getUsuario();  
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
          if (resp.status) {
            if (resp.data[0].servidores && resp.data[0].servidores.length > 0) {
              resp.data[0].servidores.forEach((s:any)=>{
                s["healthy_ssh"] = "-";
                s["healthy_agente"] = "-";
                s["uptime"] = "-";
                s["cpu"]= "-";
                s["memoria"]= "-";
                s["disco"]= "-";
                s["servicio_httpd"]= "-";
                s["servicio_ssh"]= "-";
                this.lstServidores.push(s)
                this.server.set(s.idservidor, s);
              })
            }
  
            
          } else {
            this.func.showMessage("error", "Usuario", resp.message);
          }
          this.refreshAll();
        },
        error: (err: any) => {
          this.func.closeSwal();
        },
      });
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
        groupHeaderHeight:35,
        headerHeight:35,
        defaultColDef: {
          minWidth: 90,
          filter: false,
          headerClass: 'bold',
          floatingFilter: false,
          resizable: false,
          sortable: false,
          wrapText: false,
          wrapHeaderText: true,
          suppressAutoSize: false,
          autoHeaderHeight: false,
          suppressSizeToFit: false,
          // autoHeight: true,
          cellDataType: "text",
          
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
            headerClass: "th-normal",
            field: 'nombre',
            cellClass: 'text-start',
            filter: true,
            cellRenderer: this.renderAccionNombre.bind(this),
            pinned: "left",
            minWidth: 200
          },
          // {
          //   headerName: 'Ubicación',
          //   headerClass: "th-normal",
          //   field: 'ubicacion',
          //   cellClass: 'text-start',
          //   filter: true,
          //   pinned: "left",
          //   minWidth: 200
          // },
          {
            headerName: 'Host',
            headerClass: "th-normal3",
            field: 'host',
            cellClass: 'text-start',
            filter: true,
          },
          {
            headerName: 'Agente',
            // headerStyle: { color: "black", backgroundColor: "Gainsboro" },
            headerClass: ["th-center", "th-normal4"],
            field: 'healthy_agente',
            cellClass: 'text-start',
            cellRenderer: (params: ICellRendererParams) => {
              let data = params.data;
              let dato = params.value;
              let host = data.host;
              let puerto = data.agente_puerto  ?? "Sin Asignar";
              let text = '';
              let icono = 'far fa-times-circle  t16';
              let color = 'text-danger';

              if (!["","-","1","x"].includes(dato)) {
                let d = dato.split("|");
                if (d[0]=="OK") {
                  color = 'text-success';
                  icono = 'far fa-check-circle t16';
                }else{
                  color = 'text-danger';
                  icono = 'far fa-times-circle t16';
                }
                text = "";
              } else if (dato == "1") {
                icono = 'fas fa-spinner fa-spin ';
                text = 'Revisando';
                color = 'text-primary';
              } else if (dato == "-") {
                icono = 'fas fa-minus-circle t16';
                text = '';
                color = 'text-secondary';
              }
              return `<span class="${color}"><i role="img" class='${icono}'></i> ${puerto} ${text}</span>`;
            },
          },
          // {
          //   headerName: 'Medios de Comunicación',
          //   // headerStyle: { color: "white", backgroundColor: "SteelBlue" },
          //   headerClass: ["th-center", "th-normal"],
          //   children:[
          //     {
          //       headerName: 'Agente',
          //       // headerStyle: { color: "black", backgroundColor: "Gainsboro" },
          //       headerClass: ["th-center", "th-normal3"],
          //       field: 'healthy_agente',
          //       cellClass: 'text-start',
          //       cellRenderer: (params: ICellRendererParams) => {
          //         let data = params.data;
          //         let dato = params.value;
          //         let host = data.host;
          //         let puerto = data.agente_puerto  ?? "Sin Asignar";
          //         let text = '';
          //         let icono = 'far fa-times-circle  t16';
          //         let color = 'text-danger';
  
          //         if (!["","-","1","x"].includes(dato)) {
          //           let d = dato.split("|");
          //           if (d[0]=="OK") {
          //             color = 'text-success';
          //             icono = 'far fa-check-circle t16';
          //           }else{
          //             color = 'text-danger';
          //             icono = 'far fa-times-circle t16';
          //           }
          //           text = "";
          //         } else if (dato == "1") {
          //           icono = 'fas fa-spinner fa-spin ';
          //           text = 'Revisando';
          //           color = 'text-primary';
          //         } else if (dato == "-") {
          //           icono = 'fas fa-minus-circle t16';
          //           text = '';
          //           color = 'text-secondary';
          //         }
          //         return `<span class="${color}"><i role="img" class='${icono}'></i> ${puerto} ${text}</span>`;
          //       },
          //     },
          //     // {
          //     //   headerName: 'SSH',
          //     //   // headerStyle: { color: "black", backgroundColor: "white" },
          //     //   headerClass: ["th-center", "th-normal4"],
          //     //   field: 'ssh_puerto',
          //     //   cellClass: 'text-start',
          //     //   // cellRenderer: (params: ICellRendererParams) => {
          //     //   //   let data = params.data;
          //     //   //   let dato = params.value;
          //     //   //   let host = data.host;
          //     //   //   let puerto = data.ssh_puerto ?? "Sin Asignar";
          //     //   //   let text = '';
          //     //   //   let icono = 'far fa-times-circle t16';
          //     //   //   let color = 'text-danger';
          //     //   //   if (!["","-","1","x"].includes(dato)) {
          //     //   //     let d = dato.split("|");
          //     //   //     if (d[0]=="OK") {
          //     //   //       color = 'text-success';
          //     //   //     }else{
          //     //   //       color = 'text-danger';
          //     //   //     }
          //     //   //     text = "";
          //     //   //     icono = 'far fa-check-circle t16';
          //     //   //     color = 'text-success';
          //     //   //   } else if (dato == "1") {
          //     //   //     icono = 'fas fa-spinner fa-spin';
          //     //   //     text = 'Revisando';
          //     //   //     color = 'text-primary';
          //     //   //   } else if (dato == "-") {
          //     //   //     icono = 'fas fa-minus-circle t16';
          //     //   //     text = '';
          //     //   //     color = 'text-secondary';
          //     //   //   }
          //     //   //   return `<span class="${color}"><i role="img" class='${icono}'></i> ${puerto} ${text}</span>`;
          //     //   // },
          //     // },
          //   ]
          // },
          {
            headerName: 'UpTime',
            // headerStyle: { color: "black", backgroundColor: "Gainsboro" },
            headerClass: ["th-center", "th-normal3"],
            field: 'uptime',
            filter: true,
            cellClass: 'text-start',
            cellRenderer: (params: ICellRendererParams) => {
              let dato = params.value;
              let text = '';
              let icono = 'far fa-times-circle t16';
              let color = 'text-danger';
              if (!["","-","1","x"].includes(dato)) {
                let d = dato.split("|");
                if (d[0]=="OK") {
                  color = '';
                }else{
                  color = 'text-danger';
                }
                let st = d[1].trim().split(":");
                text = `${st[0]}d ${st[1]}h${st[2]}m${st[3]}s`;
                // icono = 'far fa-clock t16';
                icono = '';
              } else if (dato == "1") {
                icono = 'fas fa-spinner fa-spin';
                text = 'Revisando';
                color = 'text-primary';
              } else if (dato == "-") {
                icono = 'fas fa-minus-circle t16';
                text = '';
                color = 'text-secondary';
              }
              return `<span class="${color}"><i role="img" class='${icono}'></i> ${text}</span>`;
            },
          },
          {
            headerName: 'Disco',
            // headerStyle: { color: "white", backgroundColor: "CadetBlue" },
            headerClass: ["th-center", "th-grupo1"],
            children:[
              {
                headerName: 'Total',
                // headerStyle: { color: "black", backgroundColor: "white" },
                headerClass: ["th-center", "th-normal4"],
                field: 'disco',
                cellClass: 'text-start',
                cellRenderer: (params: ICellRendererParams) => {
                  let dato = params.data.disco;
                  let text = '';
                  let icono = 'far fa-times-circle t16';
                  let color = 'text-danger';
                  if (!["","-","1","x"].includes(dato)) {
                    let d = dato.split("|");
                    if (d[0]=="OK") {
                      color = '';
                    }else{
                      color = 'text-danger';
                    }
                    // icono = 'fas fa-sd-card t16';
                    icono = '';
                    text = d[1].replace("/", "");
                    text = text.replace("/", "-");
                    text = text.split(" ")[0]
                    // text = text.replace(/^\/S+$/, ",")
                  } else if (dato == "1") {
                    icono = 'fas fa-spinner fa-spin';
                    text = 'Revisando';
                    color = 'text-primary';
                  } else if (dato == "-") {
                    icono = 'fas fa-minus-circle t16';
                    text = '';
                    color = 'text-secondary';
                  }
                  return `<span class="${color}"><i role="img" class='${icono}'></i> ${text}</span>`;
                },
              },
              {
                headerName: 'Usado',
                headerClass: ["th-center", "th-normal3"],
                field: 'disco',
                cellClass: 'text-start',
                cellRenderer: (params: ICellRendererParams) => {
                  let dato = params.data.disco;
                  let text = '';
                  let icono = 'far fa-times-circle t16';
                  let color = 'text-danger';
                  if (!["","-","1","x"].includes(dato)) {
                    let d = dato.split("|");
                    if (d[0]=="OK") {
                      color = '';
                    }else{
                      color = 'text-danger';
                    }
                    // icono = 'fas fa-sd-card t16';
                    icono = '';
                    text = d[1].replace("/", "");
                    text = text.replace("/", "-");
                    text = text.split(" ")[1]
                    // text = text.replace(/^\/S+$/, ",")
                  } else if (dato == "1") {
                    icono = 'fas fa-spinner fa-spin';
                    text = 'Revisando';
                    color = 'text-primary';
                  } else if (dato == "-") {
                    icono = 'fas fa-minus-circle t16';
                    text = '';
                    color = 'text-secondary';
                  }
                  return `<span class="${color}"><i role="img" class='${icono}'></i> ${text}</span>`;
                },
              },
              {
                headerName: 'Libre',
                headerClass: ["th-center", "th-normal4"],
                field: 'disco',
                cellClass: 'text-start',
                cellRenderer: (params: ICellRendererParams) => {
                  let dato = params.data.disco;
                  let text = '';
                  let icono = 'far fa-times-circle t16';
                  let color = 'text-danger';
                  if (!["","-","1","x"].includes(dato)) {
                    let d = dato.split("|");
                    if (d[0]=="OK") {
                      color = '';
                    }else{
                      color = 'text-danger';
                    }
                    // icono = 'fas fa-sd-card t16';
                    icono = '';
                    text = d[1].replace("/", "");
                    text = text.replace("/", "-");
                    text = text.split(" ")[2]
                    // text = text.replace(/^\/S+$/, ",")
                  } else if (dato == "1") {
                    icono = 'fas fa-spinner fa-spin';
                    text = 'Revisando';
                    color = 'text-primary';
                  } else if (dato == "-") {
                    icono = 'fas fa-minus-circle t16';
                    text = '';
                    color = 'text-secondary';
                  }
                  return `<span class="${color}"><i role="img" class='${icono}'></i> ${text}</span>`;
                },
              },
            ]
          },
          {
            headerName: 'Load / CPU',
            // headerStyle: { color: "white", backgroundColor: "DarkCyan" },
            headerClass: ["th-center", "th-normal"],
            children:[
              {
                headerName: '1 min',
                // headerStyle: { color: "black", backgroundColor: "Gainsboro" },
                headerClass: ["th-center", "th-normal3"],
                field: 'cpu',
                cellClass: 'text-start',
                cellRenderer: (params: ICellRendererParams) => {
                  let dato = params.value;
                  let text = '';
                  let icono = 'far fa-times-circle t16';
                  let color = 'text-danger';
                  if (!["","-","1","x"].includes(dato)) {
                    let d = dato.split("|");
                    if (d[0]=="OK") {
                      color = '';
                    }else{
                      color = 'text-danger';
                    }
                    // icono = 'fas fa-microchip t16';
                    icono = '';
                    text = d[1].split(" ")[0];
                  } else if (dato == "1") {
                    icono = 'fas fa-spinner fa-spin';
                    text = 'Revisando';
                    color = 'text-primary';
                  } else if (dato == "-") {
                    icono = 'fas fa-minus-circle t16';
                    text = '';
                    color = 'text-secondary';
                  }
                  return `<span class="${color}"><i role="img" class='${icono}'></i> ${text}</span>`;
                },
              },
              {
                headerName: '5 mins',
                // headerStyle: { color: "black", backgroundColor: "white" },
                headerClass: ["th-center", "th-normal4"],
                field: 'cpu',
                cellClass: 'text-start',
                cellRenderer: (params: ICellRendererParams) => {
                  let dato = params.value;
                  let text = '';
                  let icono = 'far fa-times-circle t16';
                  let color = 'text-danger';
                  if (!["","-","1","x"].includes(dato)) {
                    let d = dato.split("|");
                    if (d[0]=="OK") {
                      color = '';
                    }else{
                      color = 'text-danger';
                    }
                    // icono = 'fas fa-microchip t16';
                    icono = '';
                    text = d[1].split(" ")[1];
                  } else if (dato == "1") {
                    icono = 'fas fa-spinner fa-spin';
                    text = 'Revisando';
                    color = 'text-primary';
                  } else if (dato == "-") {
                    icono = 'fas fa-minus-circle t16';
                    text = '';
                    color = 'text-secondary';
                  }
                  return `<span class="${color}"><i role="img" class='${icono}'></i> ${text}</span>`;
                },
              },
              {
                headerName: '15 mins',
                headerClass: ["th-center", "th-normal3"],
                field: 'cpu',
                cellClass: 'text-start',
                cellRenderer: (params: ICellRendererParams) => {
                  let dato = params.value;
                  let text = '';
                  let icono = 'far fa-times-circle t16';
                  let color = 'text-danger';
                  if (!["","-","1","x"].includes(dato)) {
                    let d = dato.split("|");
                    if (d[0]=="OK") {
                      color = '';
                    }else{
                      color = 'text-danger';
                    }
                    // icono = 'fas fa-microchip t16';
                    icono = '';
                    text = d[1].split(" ")[2];
                  } else if (dato == "1") {
                    icono = 'fas fa-spinner fa-spin';
                    text = 'Revisando';
                    color = 'text-primary';
                  } else if (dato == "-") {
                    icono = 'fas fa-minus-circle t16';
                    text = '';
                    color = 'text-secondary';
                  }
                  return `<span class="${color}"><i role="img" class='${icono}'></i> ${text}</span>`;
                },
              },
            ]
          },
          {
            headerName: 'Memoria',
            // headerStyle: { color: "white", backgroundColor: "CadetBlue" },
            headerClass: ["th-center", "th-grupo1"],
            children:[
              {
                headerName: 'Total',
                headerClass: ["th-center", "th-normal4"],
                field: 'memoria',
                cellClass: 'text-start',
                cellRenderer: (params: ICellRendererParams) => {
                  let dato = params.value;
                  let text = '';
                  let icono = 'far fa-times-circle t16';
                  let color = 'text-danger';
                  if (!["","-","1","x"].includes(dato)) {
                    let d = dato.split("|");
                    if (d[0]=="OK") {
                      color = '';
                    }else{
                      color = 'text-danger';
                    }
                    // icono = 'fas fa-memory t16';
                    icono = '';
                    text = d[1].split(" ")[0];
                  } else if (dato == "1") {
                    icono = 'fas fa-spinner fa-spin';
                    text = 'Revisando';
                    color = 'text-primary';
                  } else if (dato == "-") {
                    icono = 'fas fa-minus-circle t16';
                    text = '';
                    color = 'text-secondary';
                  }
                  return `<span class="${color}"><i role="img" class='${icono}'></i> ${text}</span>`;
                },
              },
              {
                headerName: 'Usado',
                headerClass: ["th-center", "th-normal3"],
                field: 'memoria',
                cellClass: 'text-start',
                cellRenderer: (params: ICellRendererParams) => {
                  let dato = params.value;
                  let text = '';
                  let icono = 'far fa-times-circle t16';
                  let color = 'text-danger';
                  if (!["","-","1","x"].includes(dato)) {
                    let d = dato.split("|");
                    if (d[0]=="OK") {
                      color = '';
                    }else{
                      color = 'text-danger';
                    }
                    // icono = 'fas fa-memory t16';
                    icono = '';
                    text = d[1].split(" ")[1];
                  } else if (dato == "1") {
                    icono = 'fas fa-spinner fa-spin';
                    text = 'Revisando';
                    color = 'text-primary';
                  } else if (dato == "-") {
                    icono = 'fas fa-minus-circle t16';
                    text = '';
                    color = 'text-secondary';
                  }
                  return `<span class="${color}"><i role="img" class='${icono}'></i> ${text}</span>`;
                },
              },
              {
                headerName: 'Libre',
                headerClass: ["th-center", "th-normal4"],
                field: 'memoria',
                cellClass: 'text-start',
                cellRenderer: (params: ICellRendererParams) => {
                  let dato = params.value;
                  let text = '';
                  let icono = 'far fa-times-circle t16';
                  let color = 'text-danger';
                  if (!["","-","1","x"].includes(dato)) {
                    let d = dato.split("|");
                    if (d[0]=="OK") {
                      color = '';
                    }else{
                      color = 'text-danger';
                    }
                    // icono = 'fas fa-memory t16';
                    icono = '';
                    text = d[1].split(" ")[2];
                  } else if (dato == "1") {
                    icono = 'fas fa-spinner fa-spin';
                    text = 'Revisando';
                    color = 'text-primary';
                  } else if (dato == "-") {
                    icono = 'fas fa-minus-circle t16';
                    text = '';
                    color = 'text-secondary';
                  }
                  return `<span class="${color}"><i role="img" class='${icono}'></i> ${text}</span>`;
                },
              },
            ]
          },
          {
            headerName: 'Servicios',
            headerStyle: { color: "white", backgroundColor: "SteelBlue" },
            children:[
  
              {
                headerName: 'HTTPD',
                headerClass: ["th-center", "th-normal3"],
                field: 'servicio_httpd',
                cellClass: 'text-start',
                minWidth: 100,
                cellRenderer: (params: ICellRendererParams) => {
                  let dato = params.value
                  let text = '';
                  let icono = 'far fa-times-circle t16';
                  let color = 'text-danger';
                  if (!["","-","1","x"].includes(dato)) {
                    let d = dato.split("|");
                    if (d[0]=="OK") {
                      color = 'text-success';
                      icono = 'far fa-check-circle t16';
                    }else{
                      color = 'text-danger';
                      icono = 'far fa-times-circle t16';
                    }
                    text = d[1];
                  } else if (dato == "1") {
                    icono = 'fas fa-spinner fa-spin';
                    text = 'Revisando';
                    color = 'text-primary';
                  } else if (dato == "-") {
                    icono = 'fas fa-minus-circle t16';
                    text = '';
                    color = 'text-secondary';
                  }
                  return `<span class="${color}"><i role="img" class='${icono}'></i> ${text}</span>`;
                },
              },
              {
                headerName: 'SSH',
                headerClass: ["th-center", "th-normal4"],
                field: 'servicio_ssh',
                cellClass: 'text-start',
                minWidth: 100,
                cellRenderer: (params: ICellRendererParams) => {
                  let dato = params.value;
                  let text = '';
                  let icono = 'far fa-times-circle t16';
                  let color = 'text-danger';
                  if (!["","-","1","x"].includes(dato)) {
                    let d = dato.split("|");
                    if (d[0]=="OK") {
                      color = 'text-success';
                      icono = 'far fa-check-circle t16';
                    }else{
                      icono = 'far fa-times-circle t16';
                      color = 'text-danger';
                    }
                    text = d[1];
                  } else if (dato == "1") {
                    icono = 'fas fa-spinner fa-spin';
                    text = 'Revisando';
                    color = 'text-primary';
                  } else if (dato == "-") {
                    icono = 'fas fa-minus-circle t16';
                    text = '';
                    color = 'text-secondary';
                  }
                  return `<span class="${color}"><i role="img" class='${icono}'></i> ${text}</span>`;
                },
              },
            ]
          },
       
        ],
        
      };
  
      that.gridApi = createGrid( document.querySelector<HTMLElement>('#myGrid')!, this.gridOptions);
  
    }
  
    refreshAll() {
      var params = {
        force: true,
        suppressFlash: true,
      };
      this.gridApi!.refreshCells(params);
      this.gridApi!.setGridOption('rowData', this.lstServidores);
      // this.gridApi!.autoSizeColumns;
      this.gridApi!.autoSizeAllColumns();
      // this.gridApi!.sizeColumnsToFit;
  
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
  
    startMonitor(){
      this.playMonitor = true;
      this.sendMonitor();

      this.tmrMonitor = setInterval(() => {
        this.sendMonitor();
      }, this.tiempo_refresco *1000);
    }
    stopMonitor(){
      this.playMonitor = false;
      clearInterval(this.tmrMonitor);
    }
  
    sendMonitor(){
      this.lstServidores.forEach(server => {
        if (this.firstTime){
          this.firstTime = false;
          server.healthy_agente = "1";
          server.uptime = "1";
          server.cpu= "1";
          server.memoria= "1";
          server.disco= "1";
          server.servicio_httpd= "1";
          server.servicio_ssh= "1";
          this.refreshAll();
        }
        // this.enviaSSH(server);
  
        this.wsSvc.connect(server).subscribe({
          next: (resp:any) => {
            if (resp.idservidor){
               this.verificaServer(resp);
            }
          },
          error: (err) => {
            console.log("X",err)
          },
        });
      });
    }
  
    verificaServer(resp:any){
      if (resp.healthy_agente.split("|")[0] == "OK"){
        this.enviaStats(resp)
      } else if (resp.healthy_agente.split("|")[0] == "FAIL"){
        this.lstServidores.forEach(s=>{
          if (s.idservidor == resp.idservidor){
            s.healthy_agente = "x";
            s.uptime = "x";
            s.cpu= "x";
            s.memoria= "x";
            s.disco= "x";
            s.servicio_httpd= "x";
            s.servicio_ssh= "x";
            this.refreshAll();
            return
          }
        });
      }
    }
  
    enviaStats(resp:any){
      this.wsSvc.sendCommand(resp.idservidor, {
        action: "stats",
        identificador: "k2j3h4273864238gasdgas",
        referencia: resp.nombre,
      })
      .then(resp=>{
        this.onMessageListener(resp);
      })
      .catch(err=>{
        console.log("x", err)
      })
    }
  
    onMessageListener(e:any){
      this.loadMonitoreo = true;
      // console.log("«", e)
      let serverid = e.serverId;
      let action = e.data.action;
      let identificador = e.data.identificador;
      let referencia = e.data.referencia;
      let data:any = e.data.data;
  
      switch(action){
        case "stats":
          let msg = "";
          this.lstServidores.forEach((s:any)=>{
            if (s.idservidor == serverid){
              data.forEach((r:any)=>{
                try{
                  if (r.respuesta.returncode == 0){
                    msg = `OK|${r.respuesta.stdout}`;
                  }else{
                    msg = `FAIL|${r.respuesta.stderr}`;
                  }
                  s[r.id] = msg
                }catch(ex){}
              });
            }
          });
          this.refreshAll()
          setTimeout(()=>{
            this.loadMonitoreo = false;
          }, 500)
          break;
      }
    }
  
    // getStatus = (id: number) => {
    //   return this.wsSvc.getServerStatus(id);
    // }
  
    // ngOnDestroy(): void {
    //   this.wsSvc.disconnectAll();
    // }
  
    // enviaSSH(record:any){
    //   let param = { 
    //     host: record.host, 
    //     puerto: record.ssh_puerto 
    //   };
    //   this.generalSvc.apiRest("POST", "healthy_server", param).subscribe({
    //     next: (resp: any) => {
    //       let msg = "";
    //       if (resp.status) {
    //         msg = "OK|Conectado";
    //       } else {
    //         msg = "FAIL|No Conectado";
    //       }
    //       this.lstServidores.forEach((s:any)=>{
    //         if (s.nombre == record.nombre){
    //           s.healthy_ssh = msg;
    //         }
    //       })
    //       this.refreshAll()
  
    //     },
    //     error: (err: any) => {
    //       this.func.closeSwal();
    //     },
    //   });
    // }
  
    
  }