import { Component, inject } from '@angular/core';
import { Functions } from '../../core/helpers/functions.helper';
import { Sessions } from '../../core/helpers/session.helper';
import { AllCommunityModule, createGrid, GridApi, GridOptions, ICellRendererParams, ModuleRegistry } from 'ag-grid-community';
import { Global } from '../../core/config/global.config';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServidorService } from '../../core/services/servidor.service';
import moment from 'moment';
import { Titulo } from '../shared/titulo/titulo';
import { Path } from '../shared/path/path';
import { GeneralService } from '../../core/services/general.service';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-servidores',
  imports: [Titulo, Path, CommonModule, FormsModule],
  templateUrl: './servidores.html',
  styleUrl: './servidores.scss'
})
export class Servidores {
  private readonly serverSvc = inject(ServidorService);
  private readonly generalSvc = inject(GeneralService);
  private readonly func = inject(Functions);
  private readonly sessions = inject(Sessions);

  user: any = null;
  work: any = null;
  path:any = [];
  titulo:any = {icono: "",nombre:""}
  global = Global;

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
  public server_selected: any = {};
  
  public titulo_servidor: string | undefined;
  public agente_test: string = "";
  public ssh_test: string = "";

  lstData: Array<any> = [];
  lstServersToCheck: Array<any> = [];
  wsConn:any = null;

  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get('user'));
    this.path = [
      {nombre: "Configuración", ruta: ""}, 
      {nombre: "Servidores", ruta: "admin/servidores"}, 
    ];
  
    this.titulo = {icono: "fas fa-server",nombre: "Servidores"}

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
    this.name_selected = '';

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
      paginationPageSize: 5,
      paginationPageSizeSelector: [5, 10, 50, 100, 200, 300, 1000],
      // rowSelection: 'single',
      rowHeight: 40,
      defaultColDef: {
        flex: 1,
        minWidth: 50,
        filter: false,
        headerClass: 'bold',
        floatingFilter: false,
        resizable: false,
        sortable: false,
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
        that.lstServersToCheck = [];
        that.lstServersToCheck.push(event.data);
        // console.log(that.lstServersToCheck)
        this.server_selected = event.data
      },
      // rowSelection: { 
      //   mode: 'multiRow',
      //   enableClickSelection: false,
      //   enableSelectionWithoutKeys: false,
      //   // groupSelects: "self",
      //   isRowSelectable: (rowNode) => rowNode.data ? rowNode.data.deleted_at === null : false,
      // },
      // suppressAggFuncInHeader: true,
      // autoGroupColumnDef: {
      //   headerName: "Ubicacion",
      //   field: "localizacion",
      //   minWidth: 250,
      //   cellRenderer: "agGroupCellRenderer",
      // },
      // onSelectionChanged(event) {
      //   let rows = event.selectedNodes;
      //   that.rows_selected = rows?.length;
      //   that.lstServersToCheck = [];
      //   rows?.forEach(e=>{
      //     that.lstServersToCheck.push(e.data)
      //   })
      //   // console.log(that.lstServersToCheck)
      // },
      
      columnDefs: [
        {
          headerName: 'ID',
          headerClass: ["th-center", "th-normal"],
          field: 'idservidor',
          filter: false,
          hide: true,
        },
        {
          headerName: 'Nombre',
          headerClass: ["th-center", "th-normal"],
          field: 'nombre',
          cellClass: 'text-start',
          filter: true,
          cellRenderer: this.renderAccionNombre.bind(this),
        },
        {
          headerName: 'Ubicacion',
          headerClass: ["th-center", "th-normal"],
          field: 'ubicacion',
          cellClass: 'text-start',
          filter: true,
        },
        {
          headerName: 'Host',
          headerClass: ["th-center", "th-normal"],
          field: 'host',
          cellClass: 'text-start',
          filter: true,
        },
        {
          headerName: 'SSH',
          headerClass: ["th-center", "th-normal"],
          field: 'healthy_ssh',
          cellClass: 'text-start',
          cellRenderer: (params: ICellRendererParams) => {
            let data = params.data;
            let dato = data.healthy_ssh;
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
              icono = '';
              text = '';
              color = '';
            }
            return `<span class="${color}"><i role="img" class='${icono}'></i> ${puerto} ${text}</span>`;
          },
        },
        {
          headerName: 'Agente',
          headerClass: ["th-center", "th-normal"],
          field: 'healthy_agente',
          cellClass: 'text-start',
          cellRenderer: (params: ICellRendererParams) => {
            let data = params.data;
            let dato = data.healthy_agente;
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
              icono = '';
              text = '';
              color = '';
            }
            return `<span class="${color}"><i role="img" class='${icono}'></i> ${puerto} ${text}</span>`;
          },
        },
        {
          headerName: 'Tiempo Activo',
          headerClass: ["th-center", "th-normal"],
          field: 'uptime',
          cellClass: 'text-start',
          cellRenderer: (params: ICellRendererParams) => {
            let data = params.data;
            let dato = data.uptime;
            let icono = "";
            if (dato!="") icono = `<i role="img" class="far fa-clock"></i>`;
            return `${icono} ${dato}</span>`;
          }
        },
        {
          headerName: 'Estado',
          headerClass: ["th-center", "th-normal"],
          field: 'estado',
          cellClass: 'text-start',
          cellRenderer: (params: ICellRendererParams) => {
            let data = params.data;
            let status = data.estado;
            let text = `far fa-times-circle`;
            let color = 'text-danger';
            if (status == 1) {
              color = 'text-success';
              text = `far fa-check-circle`;
            
            }
            return `<i role="img" class="${color} ${text} t20"></i>`;
          },
        },
        {
          headerName: 'Eliminado',
          headerClass: ["th-center", "th-normal"],
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
        },
        {
          headerName: 'Accion',
          headerClass: ["th-center", "th-normal"],
          cellClass: 'text-start',
          filter: true,
          flex: 3,
          maxWidth:100,
          cellRenderer: this.renderAcciones.bind(this),
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

  renderAccionNombre(params: ICellRendererParams) {
    const button = document.createElement('button');
    button.className = 'btn btn-white';
    button.innerHTML = `<span class="link" title='Editar'>${params.data.nombre}</span>`;
    button.addEventListener('click', () => {
      this.funcEdit(params.data.idservidor);
    });
    return button;
  }

  renderAcciones(params: ICellRendererParams) {
    let button: any | undefined;

    if (params.data.deleted_at === null){
      button = document.createElement('button');
      button.className = 'btn btn-white';
      button.innerHTML = `<i role="img" class="far fa-trash-alt text-danger" title='Eliminar'></i>`;
      button.addEventListener('click', () => {
        this.procesoEspecial('eliminar un registro', 'eliminar', params.data.idservidor)
      });
    } else {
      button = document.createElement('button');
      button.className = 'btn btn-white';
      button.innerHTML = `<i role="img" class="fas fa-undo-alt text-warning" title='Recuperar'></i>`;
      button.addEventListener('click', () => {
        this.procesoEspecial('recuperar un registro', 'recuperar', params.data.idservidor)
      });
    }

    return button;
  }



  funcEdit(id: any = null) {
    this.func.goRoute(`admin/servidor/${id ? id : this.id_selected}`, true);
  }

  procesoEspecial(action = '', keyword = 'delete', id="") {
    if (this.id_selected == '' && id=="") {
      this.func.showMessage(
        'error',
        'Eliminar',
        'Debe seleccionar una fila para eliminar'
      );
      return;
    }

    if (id!=""){
      this.id_selected = id;
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

  // funcCheckHealthy(){
  //   if (this.lstServersToCheck.length == 0){
  //     return
  //   }

  //   // console.log(this.lstServersToCheck);
  //   this.lstServersToCheck.forEach(e=>{
  //     this.lstData.forEach(s=>{
  //       if (s.idservidor == e.idservidor){
  //         s.healthy_ssh = -1
  //         s.healthy_agente = -1
  //         return
  //       };
  //     })
  //     this.refreshAll()
  //     this.testSSH();
  //     this.testAgente();
  //   });
  // }

  

  testSSH(){
    this.ssh_test = "-";
    let param = { 
      host: this.server_selected.host, 
      puerto: this.server_selected.ssh_puerto 
    }
    // this.func.showLoading(`Realizando prueba de salud a ${record.nombre}`);
    this.generalSvc.apiRest("POST", "healthy_server", param).subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        console.log(resp)
        if (resp.status) {
          this.ssh_test = "1";
          this.putResults(this.server_selected.idservidor, [1, resp.data], "ssh")
        } else {
          this.ssh_test = "2";
          this.putResults(this.server_selected.idservidor, [0,""], "ssh")
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

  async testAgente() {
    this.agente_test = "-";
    let ws = `ws://${this.server_selected.host}:${this.server_selected.agente_puerto}`;
    // console.log("Conectando con " + ws)

    let wsConn:any = new WebSocket(ws);
    const opened = await this.connection(wsConn);
    
    if (opened) {
      setTimeout(()=>{
        wsConn.send('hello');
      },4000)
      this.agente_test = "1";
      this.putResults(this.server_selected.idservidor, [1, ""], "agente")
      wsConn.close(1000);
      // wsConn = null;
    } else {
      this.agente_test = "2";
      this.putResults(this.server_selected.idservidor, [0, ""], "agente")
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
