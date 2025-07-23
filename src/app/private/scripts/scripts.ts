import { Component, inject } from '@angular/core';
import { Header } from '../shared/header/header';
import { Breadcrums } from '../shared/breadcrums/breadcrums';
import { CommonModule } from '@angular/common';
import { ScriptsService } from '../../core/services/script.service';
import { Functions } from '../../core/helpers/functions.helper';
import { Sessions } from '../../core/helpers/session.helper';
import { AllCommunityModule, createGrid, GridApi, GridOptions, ICellRendererParams, ModuleRegistry } from 'ag-grid-community';
import { Global } from '../../core/config/global.config';
import Swal from 'sweetalert2';
import moment from 'moment';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-scripts',
  imports: [Header, Breadcrums, CommonModule],
  templateUrl: './scripts.html',
  styleUrl: './scripts.scss'
})
export class Scripts {
  private readonly scriptSvc = inject(ScriptsService);
  private readonly func = inject(Functions);
  private readonly sessions = inject(Sessions);

  user: any = null;

  public gridOptions: GridOptions<any> = {};
  public gridApi?: GridApi<any>;
  public gridOptionsCmds: GridOptions<any> = {};
  public gridApiCmds?: GridApi<any>;
  public id_selected: string = '';
  public id_selected_cmds: string = '';
  public is_deleted: any = null;
  public nombre_selected: string = '';

  public canR: boolean = false;
  public canW: boolean = false;
  public canD: boolean = false;

  lstData: Array<any> = [];
  lstCmds: Array<any> = [];

  accion: string = 'activos';
  


  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get('user'));
    // console.log(this.user)

    if (this.user.idrol > 1) {
      let scope = this.user.roles.permisos_crud.split('');
      this.canR = scope[0] == 'R' ? true : false;
      this.canW = scope[1] == 'W' ? true : false;
      this.canD = scope[2] == 'D' ? true : false;

      if (!this.canR) {
        this.func.showMessage(
          'info',
          'Scripts',
          'No tiene permisos para leer'
        );
      }
    }
  }

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

    this.scriptSvc.getAllFilters(this.accion).subscribe({
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
        this.id_selected = event.data.idscript;
        this.nombre_selected = event.data.nombre;
        this.is_deleted = event.data.deleted_at;
        this.lstCmds = event.data.cmds;
      },
      columnDefs: [
        {
          headerName: 'ID',
          field: 'idscript',
          filter: false,
          hide: true,
        },
        {
          headerName: 'Nombre',
          field: 'nombre',
          cellClass: 'text-start',
          sortIndex: 0,
          sort: 'asc',
          flex: 5,
        },
        {
          headerName: 'Comandos',
          field: 'cmds.length',
          cellClass: 'text-start',
        },
        {
          headerName: 'Creado',
          field: 'updated_at',
          cellClass: 'text-start',
          cellRenderer: (params: ICellRendererParams) => {
            let data = params.data;
            let fecha = data.updated_at;
            return moment(fecha).format("YYYY-MM-DD")
          }
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
    this.func.goRoute(`admin/script/${id ? id : this.id_selected}`, true);
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
        } else if (keyword == 'recuperar') {
          this.procesoRestore();
        }
      }
    });
  }

  procesoDelete() {
    this.func.showLoading('Eliminando');

    this.scriptSvc.delete(this.id_selected).subscribe({
      next: (resp: any) => {
        // console.log(resp);
        this.func.closeSwal();
        if (resp.status) {
          this.getData();
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

    this.scriptSvc.recovery(this.id_selected).subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        if (resp.status) {
          setTimeout(() => {
            this.getData();
          }, 500);
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
