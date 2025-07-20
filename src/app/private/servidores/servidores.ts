import { Component, inject } from '@angular/core';
import { Header } from '../shared/header/header';
import { Breadcrums } from '../shared/breadcrums/breadcrums';
import { Functions } from '../../core/helpers/functions.helper';
import { Sessions } from '../../core/helpers/session.helper';
import { UsuarioService } from '../../core/services/usuarios';
import { GrupoUsuarioService } from '../../core/services/grupousuarios';
import { AllCommunityModule, createGrid, GridApi, GridOptions, GroupSelectionMode, ICellRendererParams, ModuleRegistry, SelectionChangedEvent } from 'ag-grid-community';
import { Global } from '../../core/config/global.config';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServidorService } from '../../core/services/servidor';
import moment from 'moment';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-servidores',
  imports: [Header, Breadcrums, CommonModule, FormsModule],
  templateUrl: './servidores.html',
  styleUrl: './servidores.scss'
})
export class Servidores {
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
  public name_selected: string = '';
  public rows_selected: any = 0;

  lstData: Array<any> = [];
  lstServersToCheck: Array<any> = [];
  wsConn:any = null;

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

  ngOnDestroy(): void {}

  ngAfterViewInit(): void {
    this.dataGridStruct();

    setTimeout(() => {
      this.getData();
    }, Global.times[0]);
  }

  getData() {
    this.lstData = [];
    this.func.showLoading('Cargando');
    this.id_selected = '';
    this.is_deleted = '';

    this.serverSvc.getAllFilters(this.accion).subscribe({
      next: (resp: any) => {
        // console.log(resp);
        this.func.closeSwal();
        if (resp.status) {
          this.lstData = [];
          if (resp.data.length>0){
            resp.data.forEach((s:any)=>{
              s.uptime = "";
              s.healthy_ssh = -2;
              s.healthy_agente = -2;
              this.lstData.push(s);
            })

          }

          this.refreshAll();
        } else {
          this.func;
        }
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
        floatingFilter: true,
        resizable: false,
        sortable: true,
      },
      onRowClicked: (event: any) => {
        this.id_selected = event.data.idservidor;
        this.is_deleted = event.data.deleted_at;
        this.name_selected = event.data.nombre;
        if (this.rows_selected==0 && this.id_selected!='') this.rows_selected=1;
        that.lstServersToCheck = [];
        that.lstServersToCheck.push(event.data);
        // console.log(that.lstServersToCheck)
      },
      rowSelection: { 
        mode: 'multiRow',
        enableClickSelection: false,
        enableSelectionWithoutKeys: false,
        // groupSelects: "self",
        isRowSelectable: (rowNode) => rowNode.data ? rowNode.data.deleted_at === null : false,
      },
      // suppressAggFuncInHeader: true,
      // autoGroupColumnDef: {
      //   headerName: "Ubicacion",
      //   field: "localizacion",
      //   minWidth: 250,
      //   cellRenderer: "agGroupCellRenderer",
      // },
      onSelectionChanged(event) {
        let rows = event.selectedNodes;
        that.rows_selected = rows?.length;
        that.lstServersToCheck = [];
        rows?.forEach(e=>{
          that.lstServersToCheck.push(e.data)
        })
        // console.log(that.lstServersToCheck)
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
          cellRenderer: this.renderAccionNombre.bind(this),
        },
        {
          headerName: 'Ubicacion',
          field: 'localizacion',
          cellClass: 'text-start',
          filter: true,
          rowGroup: true
        },
        {
          headerName: 'Host',
          field: 'host',
          cellClass: 'text-start',
          filter: true,
          // cellRenderer: (params: ICellRendererParams) => {
          //   let data = params.data;
          //   let host = data.host;
          //   let puerto = data.puerto;
          //   let conector = puerto =="" ? '' : ':';
          //   return `${host}${conector}${puerto}`
          // }
        },

        // {
        //   headerName: 'Script Nuevo',
        //   field: 'idscript',
        //   cellClass: 'text-start',
        //   cellRenderer: (params: ICellRendererParams) => {
        //     let data = params.data;
        //     let status = data.idscript_nuevo;
        //     let text = 'No asignado';
        //     let color = 'bg-danger';
        //     if (status != null) {
        //       color = 'bg-success';
        //       text = 'Asignado';
        //     }
        //     return `<kbd class="${color} text-white">${text}</kbd>`;
        //   },
        // },
        
        {
          headerName: 'SSH',
          field: 'healthy_ssh',
          cellClass: 'text-start',
          cellRenderer: (params: ICellRendererParams) => {
            let data = params.data;
            let dato = data.healthy_ssh;
            let host = data.host;
            let puerto = data.ssh_puerto ?? "Sin Asignar";
            let text = 'No responde';
            let icono = 'far fa-times-circle t20';
            let color = 'text-danger';
            if (dato == 1) {
              icono = 'far fa-check-circle t20';
              // icono = 'fas fa-server t20';
              text = 'Saludable';
              color = 'text-success';
            } else if (dato == -1) {
              icono = 'fas fa-spinner fa-spin';
              text = 'Revisando';
              color = 'text-primary';
            } else if (dato == -2) {
              icono = 'fas fa-minus-circle t20';
              text = '';
              color = 'text-secondary';
            }
            return `<span class="${color}"><i class='${icono}'></i> ${puerto} ${text}</span>`;
          },
        },
        {
          headerName: 'Agente',
          field: 'healthy_agente',
          cellClass: 'text-start',
          cellRenderer: (params: ICellRendererParams) => {
            let data = params.data;
            let dato = data.healthy_agente;
            let host = data.host;
            let puerto = data.agente_puerto  ?? "Sin Asignar";
            let text = 'No responde';
            let icono = 'far fa-times-circle  t20';
            let color = 'text-danger';
            if (dato == 1) {
              icono = 'far fa-check-circle  t20';
              text = 'Saludable';
              color = 'text-success';
            } else if (dato == -1) {
              icono = 'fas fa-spinner fa-spin ';
              text = 'Revisando';
              color = 'text-primary';
            } else if (dato == -2) {
              icono = 'fas fa-minus-circle t20';
              text = '';
              color = 'text-secondary';
            }
            return `<span class="${color}"><i class='${icono}'></i> ${puerto} ${text}</span>`;
          },
        },
        {
          headerName: 'Tiempo Activo',
          field: 'uptime',
          cellClass: 'text-start',
          cellRenderer: (params: ICellRendererParams) => {
            let data = params.data;
            let dato = data.uptime;
            let icono = "";
            if (dato!="") icono = `<i class="far fa-clock"></i>`;
            return `${icono} ${dato}</span>`;
          }
        },
        {
          headerName: 'Estado',
          field: 'estado',
          cellClass: 'text-start',
          cellRenderer: (params: ICellRendererParams) => {
            let data = params.data;
            let status = data.estado;
            let text = 'inhabilitado';
            let color = 'bg-danger';
            if (status == 1) {
              color = 'bg-success';
              text = 'Habilitado';
            
            }
            return `<kbd class="${color} text-white">${text}</kbd>`;
          },
        },
        {
          headerName: 'Eliminado',
          field: 'deleted_at',
          cellClass: 'text-end',
          sortIndex: 0,
          sort: 'asc',
          maxWidth:120,
          cellRenderer: (params: ICellRendererParams) => {
            let data = params.data;
            let fecha = data.deleted_at;
            let text = "";
            if (fecha){
              text = moment(fecha).format("YYYY-MM-DD");
            }
            return text;
          }
        }
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

  renderAccionNombre(params: ICellRendererParams) {
    let data = params.data;
    let nombre = data.nombre;
    this.id_selected = data.idservidor;

    const button = document.createElement('button');
    button.className = 'btn btn-white';
    button.innerHTML = `<span class="link" title='Editar'>${nombre}</span>`;
    button.addEventListener('click', () => {
      this.funcEdit();
    });
    return button;
  }

  funcEdit(id: any = null) {
    this.func.goRoute(`admin/servidor/${id ? id : this.id_selected}`, true);
  }

  procesoEspecial(action = '', keyword = 'delete') {
    if (this.id_selected == '') {
      this.func.showMessage(
        'error',
        'Eliminar',
        'Debe seleccionar una fila para eliminar'
      );
      return;
    }

    Swal.fire({
      allowOutsideClick: false,
      allowEscapeKey: false,
      title: 'Pregunta',
      text: `Para ${action}, debe escribir la palabra ${keyword}.`,
      icon: 'question',
      input: 'text',
      inputPlaceholder: keyword,
      showCancelButton: true,
      confirmButtonColor: '#33a0d6',
      confirmButtonText: 'Confirmar',
      cancelButtonColor: '#f63c3a',
      cancelButtonText: 'Cancelar',
      showClass: { backdrop: 'swal2-noanimation', popup: '' },
      hideClass: { popup: '' },
      inputValidator: (text) => {
        return new Promise((resolve) => {
          if (text.trim() !== '' && text.trim() == keyword) {
            resolve('');
          } else {
            resolve(`Para ${action}, debe ingresar ${keyword}.`);
          }
        });
      },
    }).then((res) => {
      if (res.isConfirmed) {
        // console.log('action', keyword);
        if (keyword == 'eliminar') {
          this.procesoDelete();
        }else if(keyword == "recuperar"){
          this.procesoRestore();
        }
      }
    });
  }

  procesoDelete() {
    this.func.showLoading('Eliminando');

    this.serverSvc.delete(this.id_selected).subscribe({
      next: (resp: any) => {
        // console.log("DELETE", resp);
        this.func.closeSwal();
        if (resp.status) {
          setTimeout(()=>{
            this.getData();
          },500)
        } else {
          this.func;
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
      },
    });
  }

  procesoRestore() {
    this.func.showLoading('Recuperando');

    this.serverSvc.recovery(this.id_selected).subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        if (resp.status) {
          setTimeout(()=>{
            this.getData();
          },500)
        } else {
          this.func;
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
      },
    });
  }

  funcCheckHealthy(){
    if (this.lstServersToCheck.length == 0){
      return
    }

    // console.log(this.lstServersToCheck);
    this.lstServersToCheck.forEach(e=>{
      this.lstData.forEach(s=>{
        if (s.idservidor == e.idservidor){
          s.healthy_ssh = -1
          s.healthy_agente = -1
          return
        };
      })
      this.refreshAll()
      this.testSSH(e);
      this.testAgente(e);
    });
  }

  

  testSSH(record:any){

    let param = { data: { host: record.host, puerto: record.ssh_puerto } }
    // this.func.showLoading(`Realizando prueba de salud a ${record.nombre}`);
    this.serverSvc.testHealthy(param).subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        // console.log(resp)
        if (resp.status) {
          this.putResults(record.idservidor, [1, resp.data], "ssh")
        } else {
          this.putResults(record.idservidor, [0,""], "ssh")
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
      },
    });
  }

  putResults(idservidor: any, result:any, what = "ssh"){
    this.lstData.forEach(s=>{
      if (s.idservidor == idservidor){
        s[`healthy_${what}`] = result[0];
        if (what=="ssh") s.uptime = result[1];
      }
    })
    this.refreshAll();
  }

  async testAgente(record:any) {
    let ws = `ws://${record.host}:${record.agente_puerto}`;
    // console.log("Conectando con " + ws)

    let wsConn:any = new WebSocket(ws);
    const opened = await this.connection(wsConn);
    
    if (opened) {
      setTimeout(()=>{
        wsConn.send('hello');
      },4000)
      this.putResults(record.idservidor, [1, ""], "agente")
      wsConn.close(1000);
      // wsConn = null;
    } else {
      this.putResults(record.idservidor, [0, ""], "agente")
      // console.log("the socket is closed OR couldn't have the socket in time, program crashed");
    }
  }

  async connection(socket: any, timeout = 3000) {
    const isOpened = () => socket.readyState === WebSocket.OPEN;

    if (socket.readyState !== WebSocket.CONNECTING) {
      return isOpened();
    } else {
      const intrasleep = 100;
      const ttl = timeout / intrasleep; 
      // console.log(ttl)
      let loop = 0;
      while (socket.readyState === WebSocket.CONNECTING && loop < ttl) {
        await new Promise((resolve) => setTimeout(resolve, intrasleep));
        loop++;
        // console.log(loop)
      }
      return isOpened();
    }
  }


}
