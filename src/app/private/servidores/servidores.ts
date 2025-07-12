import { Component, inject } from '@angular/core';
import { Header } from '../shared/header/header';
import { Breadcrums } from '../shared/breadcrums/breadcrums';
import { Functions } from '../../core/helpers/functions.helper';
import { Sessions } from '../../core/helpers/session.helper';
import { UsuarioService } from '../../core/services/usuarios';
import { GrupoUsuarioService } from '../../core/services/grupousuarios';
import { AllCommunityModule, createGrid, GridApi, GridOptions, ICellRendererParams, ModuleRegistry } from 'ag-grid-community';
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

  lstData: Array<any> = [];

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
          this.lstData = resp.data;

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
          headerName: 'Puerto',
          field: 'puerto',
          cellClass: 'text-start',
          filter: true,
        },
        // {
        //   headerName: 'No. Usuarios',
        //   field: 'usuarios.length',
        //   cellClass: 'text-start',
        //   filter: true,
        // },
        {
          headerName: 'Script Nuevo',
          field: 'idscript',
          cellClass: 'text-start',
          cellRenderer: (params: ICellRendererParams) => {
            let data = params.data;
            let status = data.idscript_nuevo;
            let text = 'No asignado';
            let color = 'bg-danger';
            if (status != null) {
              color = 'bg-success';
              text = 'Asignado';
            }
            return `<kbd class="${color} text-white">${text}</kbd>`;
          },
        },
        {
          headerName: 'Estado',
          field: 'estado',
          cellClass: 'text-start',
          cellRenderer: (params: ICellRendererParams) => {
            let data = params.data;
            let status = data.estado;
            let text = 'Inactivo';
            let color = 'bg-danger';
            if (status == 1) {
              color = 'bg-success';
              text = 'Activo';
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
}
