import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { Header } from '../../shared/header/header';
import { Breadcrums } from '../../shared/breadcrums/breadcrums';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { GrupoUsuarioService } from '../../../core/services/grupousuarios.service';
import { UsuarioService } from '../../../core/services/usuarios.service';
import { Functions } from '../../../core/helpers/functions.helper';
import { Sessions } from '../../../core/helpers/session.helper';
import { RolMenuService } from '../../../core/services/rolmenu.service';
import { ScriptsService } from '../../../core/services/script.service';
import iconsData from '../../../core/data/icons.data';
import { AllCommunityModule, createGrid, GridApi, GridOptions, ICellRendererParams, ModuleRegistry } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

declare var $: any;

@Component({
  selector: 'app-edit',
  imports: [Header, Breadcrums, FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './edit.html',
  styleUrl: './edit.scss',
  standalone: true
})
export class Edit {
  @ViewChild('btnClose') btnClose:any;

  private readonly route = inject(ActivatedRoute);
  private readonly userSvc = inject(UsuarioService);
  private readonly rolMenuSvc = inject(RolMenuService);
  private readonly grupoSvc = inject(GrupoUsuarioService);
  private readonly func = inject(Functions);
  private readonly sessions = inject(Sessions);
  private readonly scriptSvc = inject(ScriptsService);

  user: any = null;
  iconos = iconsData;
  idgrupo_usuario: string = "";
  rstData: any;

  formData: any = {
    nombre: {
      requerido:true,
      descripcion: "El nombre del grupo puede tener dos funciones operativas en LISAH y en los servidores.",
      validacion:{
        pattern: /^[a-zA-Z0-9._-]+$/,
        patron_descripcion: "Debe ingresar un nombre válido entre mayúsculas, minúsculas, números, guión bajo o medio, punto, no espacios.",
        resultado: "",
      }
    },
    idscript_creacion: {
      requerido:false,
      descripcion: "Script asignado para ejecutar cuando se crea un grupo de usuarios",
      validacion:{
        pattern: /^[0-9]\/s+$/,
        patron: "",
        resultado: "",
      }
    },
  }

  nombre: string = "";
  idscript_creacion: number | undefined;

  lstMenu:Array<any> = [];
  selectall: boolean = false;

  lstScripts: Array<any> = [];

  public dtOptions: any = {};
  public gridOptions: GridOptions<any> = {};
  public gridApi?: GridApi<any>;
  public id_selected: string = '';
  public is_deleted: any = null;
  
  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get('user'));

    let uIDUser = this.route.snapshot.paramMap.get('id');

    if (uIDUser && uIDUser!='-1') {
      this.idgrupo_usuario = uIDUser;
    }else{
      this.idgrupo_usuario = "";
    }
    
    this.dataGridStruct();
    this.getMenuItemsByClient();
    
    setTimeout(()=>{
      this.getScripts();
      if (this.idgrupo_usuario!=""){
        this.getData();
      }
    },800)
  }

  ngOnDestroy(): void {
    this.func.encerarCampos(this.formData);
  }

  getData() {
    this.func.showLoading('Cargando');

    this.grupoSvc.getOne(this.idgrupo_usuario).subscribe({
      next: (resp: any) => {
        // console.log(resp)
        this.func.closeSwal();
        if (resp.status) {
          this.rstData = resp.data[0];
          this.populateData();
          // this.formData.idgrupo_usuario = this.lstGrupoUsuarios[0].idgrupo_usuario;
        } else {
          this.func.showMessage("error", "Grupo de Usuario", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
      },
    });
  }

  getScripts() {
    this.lstScripts = [];

    this.scriptSvc.getAll().subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.lstScripts = resp.data;
          this.refreshAll()
        } else {
          this.func.showMessage("error", "Scripts", resp.message);
        }
      },
      error: (err: any) => {
        this.func.showMessage("error", "Scripts", err);
      },
    });
  }

  populateData(){
    this.nombre = this.rstData.nombre;
    this.idscript_creacion = this.rstData.idscript_creacion ?? "";

    let found = false;
    let scope:any = [];
    let cont1= 0;
    let cont2= 0;

    this.lstMenu.forEach((m, idx)=>{
      m.check = false;
      scope = [];
      found = false;

      this.rstData.rolmenugrupos.forEach((e:any)=>{
        if (m.idrol_menu == e.idrol_menu){
          scope = e.scope.split("");
          found = true;
        } 
      })
      
      m.r = scope.includes("R");
      m.w = scope.includes("W");
      m.d = scope.includes("D");
      if (found){
        m.check = found;
      }
    })
  }

  getMenuItemsByClient() {
    this.lstMenu = [];

    this.rolMenuSvc.getRolMenuClient().subscribe({
      next: (resp: any) => {
        // console.log(resp)
        this.func.closeSwal();
        if (resp.status) {
          resp.data.forEach((e:any)=>{
            this.lstMenu.push({
              idrol_menu: e.idrol_menu,
              idmenu: e.menu[0].idmenu,
              orden: e.menu[0].orden,
              es_submenu: e.menu[0].es_submenu,
              estado: e.menu[0].estado,
              icono: e.menu[0].icono,
              nombre: e.menu[0].nombre,
              check: false,
              r: false,
              w: false,
              d: false,
            })
          })
          this.lstMenu.sort((a:any, b:any) =>
            a.orden.localeCompare(b.orden)
          );
          
        } else {
          this.func.showMessage("error", "Grupo de Usuario", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
      },
    });
  }

  validacionCampos(que = ''){
    let error = false;
    let danger = 0;
    let warning = 0;

    if (["", "nombre"].includes(que)){
      this.formData.nombre.validacion.resultado = "";
      if (!this.formData.nombre.validacion.pattern.exec(this.formData.nombre.valor)){
        error = true;
        if (this.formData.nombre.requerido){
          danger++;
        }else{
          warning++;
        }
        this.formData.nombre.validacion.resultado = this.formData.nombre.validacion.patron_descripcion;
      }
    }

    return [error, danger, warning]
  }

  funcSubmit(){

    if (this.validacionCampos()[0]){
      return
    }

    let param:any = {
      nombre: this.nombre,
      idscript_creacion: this.idscript_creacion,
      rolmenugrupos: [],
    }

    let count_menu = 0;
    this.lstMenu.forEach(e=>{
      if (e.check){
        let scope = e.r ? "R" : "";
        scope += e.w ? "W" : "";
        scope += e.d ? "D" : "";
        param.rolmenugrupos.push({
          idrol_menu: e.idrol_menu,
          idgrupo_usuario: this.idgrupo_usuario,
          scope: scope
        })
      }
    })
    
    // console.log(param)
    this.func.showLoading('Guardando');

    this.grupoSvc.save(this.idgrupo_usuario, param).subscribe({
      next: (resp: any) => {
        // console.log(resp)
        this.func.closeSwal();
        if (resp.status) {
          this.rstData = resp.data[0];
          this.funcCancelar();
        } else {
          this.func.showMessage("error", "Grupo de Usuario", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
      },
    });
  }

  funcCancelar(){
    this.func.goRoute(`admin/grupousuarios`, false, true);
  }

  selectAll(){
    this.selectall = !this.selectall;
    this.lstMenu.forEach(e=>{
      e.check = this.selectall;
      e.r = this.selectall;
      e.w = this.selectall;
      e.d = this.selectall;
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
        },
        columnDefs: [
          {
            headerName: 'ID',
            headerClass: ["th-center", "th-normal"],
            field: 'idscript',
            filter: false,
            hide: true,
          },
          {
            headerName: 'Nombre',
            headerClass: ["th-center", "th-normal"],
            field: 'nombre',
            cellClass: 'text-start',
            filter: true,
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
  
      that.gridApi = createGrid(document.querySelector<HTMLElement>('#myGrid2')!,this.gridOptions
      );
    }

  refreshAll() {
    var params = {
      force: true,
      suppressFlash: true,
    };
    this.gridApi!.refreshCells(params);
    this.gridApi!.setGridOption('rowData', this.lstScripts);
  }

  renderAcciones(params: ICellRendererParams) {
    let button: any | undefined;

    button = document.createElement('button');
    button.className = 'btn btn-white';
    button.innerHTML = `<i class="fas fa-plus text-primary" title='Seleccionar Sript'></i>`;
    button.addEventListener('click', () => {
      this.idscript_creacion = params.data.idscript;
      this.btnClose.nativeElement.click();
      // $("#ventanaModalGU").model('hide');
    });
    

    return button;
  }
}
