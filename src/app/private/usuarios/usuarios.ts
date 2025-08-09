import { Component, inject } from '@angular/core';
import { Global } from '../../core/config/global.config';
import {
  AllCommunityModule,
  createGrid,
  GridApi,
  GridOptions,
  ICellRendererParams,
  ModuleRegistry,
} from 'ag-grid-community';
import { Functions } from '../../core/helpers/functions.helper';
import { UsuarioService } from '../../core/services/usuarios.service';
import { Sessions } from '../../core/helpers/session.helper';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import moment from 'moment';
import { Titulo } from '../shared/titulo/titulo';
import { Path } from '../shared/path/path';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-usuarios',
  imports: [Titulo, Path, CommonModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class Usuarios {
  private readonly userSvc = inject(UsuarioService);
  private readonly func = inject(Functions);
  private readonly sessions = inject(Sessions);

  user: any = null;
  work: any = null;
  path:any = [];
  titulo:any = {icono: "",nombre:""}

  public dtOptions: any = {};
  public gridOptions: GridOptions<any> = {};
  public gridApi?: GridApi<any>;
  public id_selected: string = '';
  public is_deleted: any = null;

  public canR: boolean = false;
  public canW: boolean = false;
  public canD: boolean = false;

  lstData: Array<any> = [];

  accion: string = 'activos';

  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get('user'));

    this.path = [
      {nombre: "Configuración", ruta: ""}, 
      {nombre: "Usuarios", ruta: "admin/usuarios"}, 
    ];
  
    this.titulo = {icono: "fas fa-user",nombre: "Usuarios"}

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

    setTimeout(() => {
      this.getData();
    }, Global.times[0]);
  }

  getData() {
    this.lstData = [];
    this.func.showLoading('Cargando');
    this.id_selected = '';
    this.is_deleted = '';

    this.userSvc.getAllFilters(this.accion).subscribe({
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
        this.func.handleErrors("Usuarios", err);
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
        wrapHeaderText: false,
        floatingFilter: true,
        resizable: false,
        sortable: true,
      },
      onRowClicked: (event: any) => {
        this.id_selected = event.data.idusuario;
        this.is_deleted = event.data.deleted_at;
      },
      columnDefs: [],
    };

    this.gridOptions.columnDefs?.push({
      headerName: 'ID',
      field: 'idusuario',
      headerClass: ["th-center", "th-normal"],
      filter: false,
      hide: true,
    });

    if (this.user.idrol != 3) {
      this.gridOptions.columnDefs?.push({
        headerName: 'Cliente',
        field: 'cliente.nombre',
        headerClass: ["th-center", "th-normal"],
        filter: false,
        hide: false,
        sortIndex: 1,
        sort: 'asc',
      });
    }

    if (this.user.idrol == 3) {
      this.gridOptions.columnDefs?.push(
        {
          headerName: 'Grupo',
          headerClass: ["th-center", "th-normal"],
          field: 'grupo.nombre',
          cellClass: 'text-start',
          sortIndex: 2,
          sort: 'asc',
          cellRenderer: this.renderAccionGrupo.bind(this),
        },
        {
          headerName: 'Nombre',
          headerClass: ["th-center", "th-normal"],
          field: 'nombre',
          cellClass: 'text-start',
          sortIndex: 3,
          sort: 'asc',
          flex: 2,
          cellRenderer: this.renderAccionNombre.bind(this),
          
        },
        {
          headerName: 'Usuario',
          headerClass: ["th-center", "th-normal"],
          field: 'usuario',
          cellClass: 'text-start',
        },
        // {
        //   headerName: 'Ultima entrada',
        //   field: 'ultimo_logueo',
        //   cellClass: 'text-start',
        // },
        // {
        //   headerName: 'Numero de Entradas ',
        //   field: 'numero_logueos',
        //   cellClass: 'text-start',
        // },
        {
          headerName: 'Email',
          headerClass: ["th-center", "th-normal"],
          field: 'email',
          cellClass: 'text-start',
          maxWidth:150,
          cellRenderer: (params: ICellRendererParams) => {
            let data = params.data;
            let email = data.email;
            let confirmado = data.email_confirmado;
            let adicional = `far fa-times-circle text-danger`;
            if (confirmado) {
              adicional = 'far fa-check-circle text-success';
            }

            let correo = `far fa-times-circle text-danger`;
            if (email) {
              correo = 'far fa-check-circle text-success';
            }

            return `
              <i role="img" class="${correo} t20" title="Email"></i>  <i role="img" class="${adicional} t20" title="Email Confirmado"></i>
              `;
          },
        },
        {
          headerName: 'Servidores',
          headerClass: ["th-center", "th-normal"],
          field: 'servidores.length',
          cellClass: 'text-start',
          maxWidth: 150,
          cellRenderer: (params: ICellRendererParams)=>{
            return `<i role="img" class="fas fa-server text-primary t20 mr-2"></i> <span class="t16">${params.value}</span>`
          }
        },
        {
          headerName: 'Estado',
          headerClass: ["th-center", "th-normal"],
          field: 'estado',
          cellClass: 'text-start',
          maxWidth:100,
          cellRenderer: (params: ICellRendererParams) => {
            let data = params.data;
            let status = data.estado;
            let icono = 'far fa-times-circle';
            let color = 'text-danger';
            if (status == 1) {
              color = 'text-success';
              icono = 'far fa-check-circle';
            }
            return `<i role="img" class="${color} ${icono} t20"></i>`;
          },
        },
        {
          headerName: 'Eliminado',
          headerClass: ["th-center", "th-normal"],
          field: 'deleted_at',
          cellClass: 'text-start',
          sortIndex: 0,
          sort: 'asc',
          maxWidth:180,
          cellRenderer: (params: ICellRendererParams) => {
            let data = params.data;
            let fecha = data.deleted_at;
            let text = "";
            if (fecha){
              text = moment(fecha).format("YYYY-MM-DD");
            }else{
              text = `<i role="img" class="fas fa-minus text-dark t20"></i>`
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
          maxWidth:80,
          cellRenderer: this.renderAcciones.bind(this),
        },
        
      );
    }

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

  renderAccionGrupo(params: ICellRendererParams) {
    let nombre = params.value;
    let grupoid = params.data.idgrupo_usuario;

    const button = document.createElement('button');
    button.className = 'btn btn-white';
    button.innerHTML = `<span class="link" title='Editar Grupo de Usuario'>${nombre}</span>`;
    button.addEventListener('click', () => {
      this.funcEditGrupo(grupoid);
    });
    return button;
  }

  renderAccionNombre(params: ICellRendererParams) {
    let nombre = params.value;
    let grupoid = params.data.idgrupo_usuario;

    const button = document.createElement('button');
    button.className = 'btn btn-white';
    button.innerHTML = `<span class="link" title='Editar Usuario'>${nombre}</span>`;
    button.addEventListener('click', () => {
      this.funcEdit(params.data.idusuario);
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
        this.procesoEspecial('eliminar un registro', 'eliminar', params.data.idusuario)
      });
    } else {
      button = document.createElement('button');
      button.className = 'btn btn-white';
      button.innerHTML = `<i role="img" class="fas fa-undo-alt text-warning" title='Recuperar'></i>`;
      button.addEventListener('click', () => {
        this.procesoEspecial('recuperar un registro', 'recuperar', params.data.idusuario)
      });
    }

    return button;
  }
  
  funcEditGrupo(id: any = null) {
    this.func.goRoute(`admin/grupousuario/${id}`, true);
  }
  funcEdit(id: any = null) {
    this.func.goRoute(`admin/usuario/${id ? id : this.id_selected}`, true);
  }

  procesoEspecial(action = '', keyword = 'delete', idusuario="") {
    if (this.id_selected == '' && idusuario=="") {
      this.func.showMessage(
        'error',
        'Eliminar',
        'Debe seleccionar una fila para eliminar'
      );
      return;
    }

    if (idusuario!=""){
      this.id_selected = idusuario;
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

    this.userSvc.delete(this.id_selected).subscribe({
      next: (resp: any) => {
        // console.log(resp);
        this.func.closeSwal();
        if (resp.status) {
          this.getData();
        } else {
          this.func.handleErrors("Server", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
        this.func.handleErrors("Usuarios", err);
      },
    });
  }

  procesoRestore() {
    this.func.showLoading('Recuperando');

    this.userSvc.recovery(this.id_selected).subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        if (resp.status) {
          setTimeout(() => {
            this.getData();
          }, 500);
        } else {
          this.func.handleErrors("Server", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
        this.func.handleErrors("Usuarios", err);
      },
    });
  }
}
