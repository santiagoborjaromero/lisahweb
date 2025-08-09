import { Component, inject } from '@angular/core';
import { Functions } from '../../core/helpers/functions.helper';
import { Sessions } from '../../core/helpers/session.helper';
import { AllCommunityModule, createGrid, GridApi, GridOptions, ICellRendererParams, ModuleRegistry } from 'ag-grid-community';
import { Global } from '../../core/config/global.config';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TemplateService } from '../../core/services/template.service';
import { Titulo } from '../shared/titulo/titulo';
import { Path } from '../shared/path/path';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-templates',
  imports: [Titulo, Path, CommonModule, FormsModule],
  templateUrl: './templates.html',
  styleUrl: './templates.scss'
})
export class Templates {
private readonly tempSvc = inject(TemplateService);
  private readonly func = inject(Functions);
  private readonly sessions = inject(Sessions);

  user: any = null;
  path:any = [];
  titulo:any = {icono: "",nombre:""}

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
    this.path = [
      {nombre: "Configuración", ruta: ""}, 
      {nombre: "Comandos", ruta: "admin/templates"}, 
    ];
  
    this.titulo = {icono: "fab fa-wpforms",nombre: "Lista de Comandos"}

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

    // console.log(this.accion)

    this.tempSvc.getAllFilters(this.accion).subscribe({
      next: (resp: any) => {
        // console.log(resp);
        this.func.closeSwal();
        if (resp.status) {
          this.lstData = resp.data;

          this.refreshAll();
        } else {
          this.func.handleErrors("Server", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
        this.func.handleErrors("Templates", err);
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
        this.id_selected = event.data.idtemplate_comando;
        this.is_deleted = event.data.deleted_at;
      },
      columnDefs: [
        {
          headerName: 'ID',
          headerClass: ["th-center", "th-normal"],
          field: 'idtemplate_comando',
          filter: false,
          hide: true,
        },
        {
          headerName: 'Alias',
          headerClass: ["th-center", "th-normal"],
          field: 'alias',
          filter: true,
        },
        {
          headerName: 'Linea de Comando',
          headerClass: ["th-center", "th-normal"],
          field: 'linea_comando',
          cellClass: 'text-start',
          filter: true,
          flex:4,
          cellRenderer: (params: ICellRendererParams) => {
            let data = params.data;
            let linea = data.linea_comando;
            linea = linea.replace(/{/g, "<kbd class='bg-secondary text-white'>")
            linea = linea.replace(/}/g, "</kbd>")
            return `<span>${linea}</span>`;
          },
        },
        {
          headerName: 'Estado',
          headerClass: ["th-center", "th-normal"],
          field: 'estado',
          cellClass: 'text-start',
          maxWidth:100,
          cellRenderer: (params: ICellRendererParams) => {
            let data = params.data;
            let status = data.deleted_at;
            let icono = 'far fa-times-circle';
            let color = 'text-danger';
            if (status == null) {
              color = 'text-success';
              icono = 'far fa-check-circle';
            }
            return `<i role="img" class="${color} ${icono} t20"></i>`;
          },
        },
        {
          headerName: 'Accion',
          headerClass: ["th-center", "th-normal"],
          cellClass: 'text-start',
          filter: true,
          flex: 3,
          maxWidth:80,
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

  renderAcciones(params: ICellRendererParams) {
    let button: any | undefined;

    if (params.data.deleted_at === null){
      button = document.createElement('button');
      button.className = 'btn btn-white';
      button.innerHTML = `<i role="img" class="far fa-trash-alt text-danger" title='Eliminar'></i>`;
      button.addEventListener('click', () => {
        this.procesoEspecial('eliminar un registro', 'eliminar', params.data.idtemplate_comando)
      });
    } else {
      button = document.createElement('button');
      button.className = 'btn btn-white';
      button.innerHTML = `<i role="img" class="fas fa-undo-alt text-warning" title='Recuperar'></i>`;
      button.addEventListener('click', () => {
        this.procesoEspecial('recuperar un registro', 'recuperar', params.data.idtemplate_comando)
      });
    }

    return button;
  }

  funcEdit(id: any = null) {
    this.func.goRoute(`admin/template/${id ? id : this.id_selected}`, true);
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

    if (id != ""){
      this.id_selected == id;
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

    this.tempSvc.delete(this.id_selected).subscribe({
      next: (resp: any) => {
        // console.log("DELETE", resp);
        this.func.closeSwal();
        if (resp.status) {
          setTimeout(()=>{
            this.getData();
          },500)
        } else {
          this.func.handleErrors("Server", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
        this.func.handleErrors("Templates", err);
      },
    });
  }

  procesoRestore() {
    this.func.showLoading('Recuperando');

    this.tempSvc.recovery(this.id_selected).subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        if (resp.status) {
          setTimeout(()=>{
            this.getData();
          },500)
        } else {
          this.func.handleErrors("Server", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
        this.func.handleErrors("Templates", err);
      },
    });
  }
}
