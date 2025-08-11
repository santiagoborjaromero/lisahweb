import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Functions } from '../../../core/helpers/functions.helper';
import { Sessions } from '../../../core/helpers/session.helper';
import { TemplateService } from '../../../core/services/template.service';
import { ScriptsService } from '../../../core/services/script.service';
import {
  AllCommunityModule,
  createGrid,
  GridApi,
  GridOptions,
  ICellRendererParams,
  ModuleRegistry,
} from 'ag-grid-community';
import { Global } from '../../../core/config/global.config';
import Swal from 'sweetalert2';
import { Titulo } from '../../shared/titulo/titulo';
import { Path } from '../../shared/path/path';
import vForm from './vform';
import { GeneralService } from '../../../core/services/general.service';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-edit',
  imports: [Titulo, Path, CommonModule, FormsModule],
  templateUrl: './edit.html',
  styleUrl: './edit.scss',
  standalone: true,
})
export class Edit {
  @ViewChild('modal') modal?: ElementRef;

  private readonly route = inject(ActivatedRoute);
  private readonly func = inject(Functions);
  private readonly sessions = inject(Sessions);
  private readonly tempSvc = inject(TemplateService);
  private readonly scriptSvc = inject(ScriptsService);
  private readonly generalSvc = inject(GeneralService);

  user: any = null;
  path:any = [];
  titulo:any = {icono: "",nombre:""}
  idscript: string = '';
  rstData: any;
  validador: any = vForm;

  nombre: string = '';
  linea: string = '';
  buscar: string = '';
  estado: boolean = true;

  lstTemplate_Original: Array<any> = [];
  lstTemplate: Array<any> = [];
  lstCmds: Array<any> = [];

  public dtOptions: any = {};
  public gridOptions: GridOptions<any> = {};
  public gridApi?: GridApi<any>;
  public id_selected: string = '';
  public is_deleted: any = null;

  public canR: boolean = false;
  public canW: boolean = false;
  public canD: boolean = false;

  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get('user'));

    let uIDUser = this.route.snapshot.paramMap.get('id');

    if (uIDUser && uIDUser != '-1') {
      this.idscript = uIDUser;
    } else {
      this.idscript = '';
    }

    this.path = [
      {nombre: "Configuración", ruta: ""}, 
      {nombre: "Scripts", ruta: "admin/scripts"}, 
      {nombre: this.idscript == "" ? "Nuevo" : "Edición", ruta: `admin/script/${this.idscript}`}, 
    ];
  
    this.titulo = {icono: "fas fa-superscript",nombre: `Scripts - ${this.idscript == "" ? "Nuevo" : "Edición"}`}

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

    if (this.idscript != '') {
      setTimeout(() => {
        this.getData();
      }, Global.times[0]);
    }

    this.getTemplates();
  }

  ngOnDestroy(): void {
    this.func.encerarCampos(this.validador);
  }

  getData() {
    this.rstData = null;

    this.func.showLoading('Cargando');

    this.scriptSvc.getOne(this.idscript).subscribe({
      next: (resp: any) => {
        // console.log(resp);
        this.func.closeSwal();
        if (resp.status) {
          this.rstData = resp.data[0];
          this.lstCmds = this.rstData.cmds;
          this.nombre = this.rstData.nombre;
          this.refreshAll();
        } else {
          this.func.showMessage('error', 'Usuario', resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
        this.func.handleErrors("Scripts", err);
      },
    });
  }

  getTemplates(idtemplate_comando="") {
    this.lstTemplate = [];
    this.lstTemplate_Original = [];

    this.tempSvc.getAll().subscribe({
      next: (resp: any) => {
        // console.log(resp);
        if (resp.status) {
          this.lstTemplate = resp.data;
          this.lstTemplate_Original = Array.from(this.lstTemplate);
          if (idtemplate_comando!="") this.addItem(idtemplate_comando);
        } else {
          this.func.showMessage('error', 'Templates', resp.message);
        }
      },
      error: (err: any) => {
        // this.func.showMessage('error', 'Templates', err);
        this.func.handleErrors("Templates", err);
      },
    });
  }

  filtrar() {
    this.lstTemplate = [];
    if (this.buscar == '') {
      this.lstTemplate = Array.from(this.lstTemplate_Original);
    } else {
      this.lstTemplate_Original.forEach((e) => {
        if (
          e.alias.toLowerCase().indexOf(this.buscar.toLowerCase()) > -1 ||
          e.linea_comando.toLowerCase().indexOf(this.buscar.toLowerCase()) > -1
        ) {
          this.lstTemplate.push(e);
        }
      });
    }
  }

  addItem(idtemplate_comando: any) {
    this.lstTemplate_Original.forEach((e) => {
      if (e.idtemplate_comando == idtemplate_comando) {
        this.lstCmds.push(e);
      }
    });
    this.refreshAll();
  }

  funcSubmit() {
    let data = {
      nombre: this.nombre,
      estado: this.estado,
      cmds: this.lstCmds,
    };
   
    if(this.func.validaCampos(this.validador, data)){
      return;
    }

    this.func.showLoading('Guardando');

    let method = "POST";
    let url = "script";
    if (this.idscript != ""){
      method = "PUT";
      url = `script/${this.idscript}`;
    }

    this.generalSvc.apiRest(method, url, data).subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        if (resp.status) {
          this.funcCancelar();
        } else {
          this.func.showMessage('error', 'Scripts', resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
        this.func.handleErrors("Scripts", err);
      },
    });
  }

  funcCancelar() {
    this.func.goRoute(`admin/scripts`, false, true);
  }

  dataGridStruct() {
    let that = this;
    this.gridOptions = {
      rowData: [],
      pagination: false,
      paginationPageSize: 50,
      paginationPageSizeSelector: [5, 10, 50, 100, 200, 300, 1000],
      // rowSelection: 'single',
      rowHeight: 50,
      rowDragEntireRow: true,
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
      },
      onRowDragEnd: (event) => {
        // console.log(event)
        let data = event.node.data;
        let from = event.node.id;
        let to = event.node.sourceRowIndex;
        // console.log("from", from, "to", to )
        this.reordenarCmds(from, to);
      },
      rowDragManaged: true,
      columnDefs: [
        {
          headerName: 'ID',
          headerClass: ["th-center", "th-normal"],
          field: 'idtemplate_comando',
          filter: false,
          hide: true,
        },
        {
          headerName: 'Línea de Comando',
          headerClass: ["th-center", "th-normal"],
          field: 'linea_comando',
          cellClass: 'text-start',
          filter: true,
          flex: 11,
          rowDrag: true,
        },
        {
          headerName: 'Accion',
          headerClass: ["th-center", "th-normal"],
          field: 'idtemplate_comando',
          cellClass: 'text-start',
          cellRenderer: this.renderAccion.bind(this),
          autoHeight: true,
          filter: false,
        },
      ],
    };

    that.gridApi = createGrid(
      document.querySelector<HTMLElement>('#myGrid')!,
      this.gridOptions
    );
  }

  renderAccion(params: ICellRendererParams) {
    const button = document.createElement('button');
    button.className = 'btn btn-link text-danger';
    button.innerHTML = '<i role="img" class="far fa-trash-alt"></i>';
    button.addEventListener('click', () => {
      this.quitar(params.data.idtemplate_comando);
    });
    return button;
  }

  quitar(idtemplate_comando: any) {
    let index = -1;
    let found = false;
    this.lstCmds.forEach((e, idx) => {
      if (e.idtemplate_comando == idtemplate_comando) {
        index = idx;
        found = true;
      }
    });
    if (found) {
      this.lstCmds.splice(index, 1);
      this.refreshAll();
    }
  }

  refreshAll() {
    var params = {
      force: true,
      suppressFlash: true,
    };
    this.gridApi!.refreshCells(params);
    this.gridApi!.setGridOption('rowData', this.lstCmds);
  }

  reordenarCmds(from: any, to: any) {
    let data = this.lstCmds[from];
    this.lstCmds.splice(from, 1);
    this.lstCmds.splice(to, 0, data);
    this.refreshAll();
  }

  // procesoEspecial(action = '', keyword = 'delete') {
  //   if (this.id_selected == '') {
  //     this.func.showMessage(
  //       'error',
  //       'Eliminar',
  //       'Debe seleccionar una fila para eliminar'
  //     );
  //     return;
  //   }

  //   Swal.fire({
  //     allowOutsideClick: false,
  //     allowEscapeKey: false,
  //     title: 'Pregunta',
  //     text: `Para ${action}, debe escribir la palabra ${keyword}.`,
  //     icon: 'question',
  //     input: 'text',
  //     inputPlaceholder: keyword,
  //     showCancelButton: true,
  //     confirmButtonColor: '#33a0d6',
  //     confirmButtonText: 'Confirmar',
  //     cancelButtonColor: '#f63c3a',
  //     cancelButtonText: 'Cancelar',
  //     showClass: { backdrop: 'swal2-noanimation', popup: '' },
  //     hideClass: { popup: '' },
  //     inputValidator: (text) => {
  //       return new Promise((resolve) => {
  //         if (text.trim() !== '' && text.trim() == keyword) {
  //           resolve('');
  //         } else {
  //           resolve(`Para ${action}, debe ingresar ${keyword}.`);
  //         }
  //       });
  //     },
  //   }).then((res) => {
  //     if (res.isConfirmed) {
  //       // console.log('action', keyword);
  //       if (keyword == 'eliminar') {
  //         this.procesoDelete();
  //       } else if (keyword == 'recuperar') {
  //         this.procesoRestore();
  //       }
  //     }
  //   });
  // }

  // procesoDelete() {
  //   this.func.showLoading('Eliminando');

  //   this.scriptSvc.delete(this.id_selected).subscribe({
  //     next: (resp: any) => {
  //       // console.log("DELETE", resp);
  //       this.func.closeSwal();
  //       if (resp.status) {
  //         setTimeout(() => {
  //           this.getData();
  //         }, 500);
  //       } else {
  //         this.func.handleErrors("Server", resp.message);
  //       }
  //     },
  //     error: (err: any) => {
  //       this.func.closeSwal();
  //     },
  //   });
  // }

  // procesoRestore() {
  //   this.func.showLoading('Recuperando');
  //   this.scriptSvc.recovery(this.id_selected).subscribe({
  //     next: (resp: any) => {
  //       this.func.closeSwal();
  //       if (resp.status) {
  //         setTimeout(() => {
  //           this.getData();
  //         }, 500);
  //       } else {
  //         this.func.handleErrors("Server", resp.message);
  //       }
  //     },
  //     error: (err: any) => {
  //       this.func.closeSwal();
  //     },
  //   });
  // }

  addCommand() {
    Swal.fire({
      allowOutsideClick: false,
      allowEscapeKey: false,
      title: 'Template de comandos',
      text: `Ingrese la linea de comando`,
      // icon: 'question',
      input: 'text',
      inputPlaceholder: "",
      showCancelButton: true,
      confirmButtonColor: '#33a0d6',
      confirmButtonText: 'Confirmar',
      cancelButtonColor: '#f63c3a',
      cancelButtonText: 'Cancelar',
      showClass: { backdrop: 'swal2-noanimation', popup: '' },
      hideClass: { popup: '' },
      inputValidator: (text) => {
        return new Promise((resolve) => {
          if (text.trim() !== '') {
            resolve('');
          } else {
            resolve(`La linea de comandos no puede estar vacia.`);
          }
        });
      },
    }).then((res) => {
      if (res.isConfirmed) {
        this.procesoAddCommand(res.value);
      }
    });
  }


  procesoAddCommand(linea_comando = ""){
    let param = { data: {linea_comando} };
    this.func.showLoading('Creando línea de comando');
    this.tempSvc.save(param, "").subscribe({
      next: (resp: any) => {
        // console.log(resp)
        this.func.closeSwal();
        if (resp.status) {
          let data = resp.data;
          this.getTemplates(data.idtemplate_comando);
        } else {
          this.func.showMessage("error", "Template de Comandos", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
        this.func.handleErrors("Scripts", err);
      },
    });
  }
}
