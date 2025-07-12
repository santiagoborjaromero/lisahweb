import { Component, inject, Input } from '@angular/core';
import { Header } from '../../shared/header/header';
import { Breadcrums } from '../../shared/breadcrums/breadcrums';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UsuarioService } from '../../../core/services/usuarios';
import { Functions } from '../../../core/helpers/functions.helper';
import { Sessions } from '../../../core/helpers/session.helper';
import { GrupoUsuarioService } from '../../../core/services/grupousuarios';
import { ClienteService } from '../../../core/services/clientes';
import { ActivatedRoute, Router } from '@angular/router';
import vForm from './vform';
import { ServidorService } from '../../../core/services/servidor';
import { AllCommunityModule, createGrid, GridApi, GridOptions, ICellRendererParams, ModuleRegistry } from 'ag-grid-community';


ModuleRegistry.registerModules([AllCommunityModule]);



@Component({
  selector: 'app-edit',
  imports: [Header, Breadcrums, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './edit.html',
  styleUrl: './edit.scss'
})
export class Edit {
  // @Input("id") uIDUser!:string;

  private readonly route = inject(ActivatedRoute);
  private readonly servidoresSvc = inject(ServidorService);
  private readonly clientesSvc = inject(ClienteService);
  private readonly userSvc = inject(UsuarioService);
  private readonly grupoSvc = inject(GrupoUsuarioService);
  private readonly func = inject(Functions);
  private readonly sessions = inject(Sessions);

  user: any = null;
  idusuario: string = "";
  rstData: any;

  idrol =  3;
  idgrupo_usuario = "";
  grupo_usuario = "-- Ninguno -- ";
  idcliente = "";
  estado =  1;
  nombre = "";
  usuario = "";
  ntfy_identificador = "";
  email = "";
  ultimo_logueo = "--:--:--"
  buscar: string = "";

  validador:any = vForm; 

  lstGrupoUsuarios:Array<any> = [];
  lstClientes:Array<any> = [];
  selectall: boolean = false;
  lstServidores_Original:Array<any> = [];
  lstServidores:Array<any> = [];
  lstSvrs:Array<any> = [];
  numero_servidores:number = 0;

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
      this.idusuario = uIDUser;
    }else{
      this.idusuario = "";
    }

    this.idrol = this.user.idrol;
    this.idcliente = this.user.idcliente;

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
     if (this.idusuario != ""){
      this.getData();
    }

    if (this.user.idrol == 1){
      this.getClientes();
    }

    this.getGrupoUsuarios();
    this.getServidores();
  }

  getData(){
    this.rstData = null;

    this.func.showLoading('Cargando');

    this.userSvc.getOne(this.idusuario).subscribe({
      next: (resp: any) => {
        // console.log(resp);
        this.func.closeSwal();
        if (resp.status) {
          this.rstData = resp.data[0];
          this.idrol = this.rstData.idrol;
          this.idgrupo_usuario = this.rstData.idgrupo_usuario;
          this.idcliente = this.rstData.idcliente;
          this.estado = this.rstData.estado;
          this.nombre = this.rstData.nombre;
          this.usuario = this.rstData.usuario;
          this.ntfy_identificador = this.rstData.ntfy_identificador;
          this.email = this.rstData.email;
          this.lstSvrs = this.rstData.servidores;
          this.numero_servidores = this.lstSvrs.length;
          this.grupo_usuario = this.rstData.grupo.nombre;
          this.ultimo_logueo = this.rstData.ultimo_logueo;
          this.refreshAll();
        } else {
          this.func.showMessage("error", "Usuario", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
      },
    });
  }

  getGrupoUsuarios(){
    this.lstGrupoUsuarios = [];

    this.grupoSvc.getAllFromClient(this.idcliente).subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        if (resp.status) {
          this.lstGrupoUsuarios = resp.data;
          this.idgrupo_usuario = this.lstGrupoUsuarios[0].idgrupo_usuario;
        } else {
          this.func.showMessage("error", "Grupo de Usuario", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
      },
    });
  }


  getClientes(){
    this.lstClientes = [];

    this.clientesSvc.getAll().subscribe({
      next: (resp: any) => {
        // console.log(resp)
        this.func.closeSwal();
        if (resp.status) {
          this.lstClientes = resp.data;
          this.idcliente = this.lstClientes[0].idcliente;
          this.getGrupoUsuarios();
        } else {
          this.func.showMessage("error", "Clientes", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
      },
    });
  }

  getServidores(){
    this.lstServidores = [];

    this.servidoresSvc.getAll().subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        if (resp.status) {
          resp.data.forEach((e:any) => {
            resp.check = false;
            this.lstServidores_Original.push(e);
          });
          this.lstServidores = Array.from(this.lstServidores_Original);
        } else {
          this.func.showMessage("error", "Servidores", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
      },
    });
  }

  validacionCampos(que = ''){
    let error = false;
    let keys = Object.keys(this.validador);
    keys.forEach(key=>{
      if (que=="" || que == key){

        if (this.validador[key].requerido){
          this.validador[key].validacion.resultado = "";
          // if (!this.validador[key].validacion.pattern.exec(eval(`this.${key}`))){
          if (!this.validador[key].validacion.pattern.exec((0,eval)(key))){
            error = true;
            this.validador[key].validacion.resultado = this.validador[key].validacion.patron_descripcion;
          }

        }
      }
    });
    return error
  }

  funcSubmit(){

    if (this.validacionCampos()){
      return;
    }

    let param = {
      data: {
        idrol: this.idrol,
        idgrupo_usuario: this.idgrupo_usuario,
        idcliente: this.idcliente,
        estado: this.estado,
        nombre: this.nombre,
        usuario: this.usuario,
        ntfy_identificador: this.ntfy_identificador,
        email: this.email,
        servidores: this.lstSvrs
      }
    }

    this.func.showLoading('Guardando');

    this.userSvc.save(param, this.idusuario).subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        if (resp.status) {
          this.funcCancelar();
        } else {
          this.func.showMessage("error", "Usuario", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
      },
    });
  }

  funcCancelar(){
    this.func.goRoute(`admin/usuarios`, false, true);
  }

  selectAll(){
    this.selectall = !this.selectall;
    this.lstServidores.forEach(e=>{
      e.check = this.selectall;
    });

  }

  filtrar(){
    this.lstServidores = [];
    if (this.buscar == ""){
      this.lstServidores = Array.from(this.lstServidores_Original);
    }else{
      this.lstServidores_Original.forEach(e => {
         if ( 
            e.nombre.toLowerCase().indexOf(this.buscar.toLowerCase())>-1 ||
            e.host.toLowerCase().indexOf(this.buscar.toLowerCase())>-1 ||
            e.puerto.toLowerCase().indexOf(this.buscar.toLowerCase())>-1 
          ){
          this.lstServidores.push(e)
        }
      });
    }
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
      // autoSizeStrategy: {
      //   type: 'fitCellContents'
      // },
      suppressAutoSize:true, 
      // rowDragEntireRow: true,
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
      },
      onRowDragEnd: (event) => {
        // console.log(event)
        // let data = event.node.data;
        // let from = event.node.id;
        // let to = event.node.sourceRowIndex;
        // console.log("from", from, "to", to )
        // this.reordenarCmds(from, to);
      },
      rowDragManaged: false,
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
        },
        {
          headerName: 'Puerto',
          field: 'puerto',
          cellClass: 'text-start',
          filter: true,
        },
        {
          headerName: 'Accion',
          field: 'idtemplate_comando',
          cellClass: 'text-start',
          cellRenderer: this.renderAccion.bind(this),
          autoHeight: true,
          filter: false,
          maxWidth:100,
        },

      ],
    };

    // this.gridOptions.autoSizeStrategy;
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
    this.gridApi!.setGridOption('rowData', this.lstSvrs);
    // this.gridOptions.autoSizeStrategy;
  }

  renderAccion(params: ICellRendererParams) {
    const button = document.createElement('button');
    button.className = 'btn btn-link text-danger';
    button.innerHTML = '<i class="far fa-trash-alt"></i>';
    button.addEventListener('click', () => {
      this.quitar(params.data.idservidor);
    });
    return button;
  }

  quitar(idservidor:any){
    let index = -1;
    let found = false;
    this.lstSvrs.forEach( (e,idx)=>{
      if (e.idservidor == idservidor){
        index = idx;
        found = true;
      }
    })
    if (found){
      this.lstSvrs.splice(index,1);
      this.refreshAll();
    }
  }

  addItem(idservidor:any){
    this.lstServidores_Original.forEach( (e, idx)=>{
      if (e.idservidor == idservidor){
        this.lstSvrs.push(e);
        try{
          this.lstServidores[idx].check = true;
        }catch(ex){}
        this.lstServidores_Original[idx].check = true;
      }
    })
    this.refreshAll();
  }

  actualizaServidores(){
    let found = false;
    this.lstServidores_Original.forEach(s=>{
      found = false;
      this.lstSvrs.forEach( (e,idx)=>{
        if (e.idservidor == s.idservidor){
          found = true;
        }
      })
      s.check = found;
    })
    this.lstServidores = Array.from(this.lstServidores_Original);
  }


}
