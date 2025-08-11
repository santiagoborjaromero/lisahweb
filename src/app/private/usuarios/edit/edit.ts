import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UsuarioService } from '../../../core/services/usuarios.service';
import { Functions } from '../../../core/helpers/functions.helper';
import { Sessions } from '../../../core/helpers/session.helper';
import { GrupoUsuarioService } from '../../../core/services/grupousuarios.service';
import { ClienteService } from '../../../core/services/clientes.service';
import { ActivatedRoute, Router } from '@angular/router';
import vForm from './vform';
import { ServidorService } from '../../../core/services/servidor.service';
import { AllCommunityModule, createGrid, GridApi, GridOptions, ICellRendererParams, ModuleRegistry, InfiniteRowModelModule,IDatasource, IGetRowsParams   } from 'ag-grid-community';
import { Titulo } from '../../shared/titulo/titulo';
import { Path } from '../../shared/path/path';
import { GeneralService } from '../../../core/services/general.service';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-edit',
  imports: [Titulo, Path, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './edit.html',
  styleUrl: './edit.scss',
  standalone: true
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
  private readonly generalSvc = inject(GeneralService);

  user: any = null;
  path:any = [];
  titulo:any = {icono: "",nombre:""}
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
  paginacion = 10;
  
  lstGrupoUsuarios:Array<any> = [];
  lstClientes:Array<any> = [];
  selectall: boolean = false;
  lstServidores_Original:Array<any> = [];
  lstServidores:Array<any> = [];
  lstSvrs:Array<any> = [];
  lstSvrs_original:Array<any> = [];
  numero_servidores:number = 0;
  
  public dtOptions: any = {};
  public gridOptions: GridOptions<any> = {};
  public gridApi?: GridApi<any>;
  public id_selected: string = '';
  public is_deleted: any = null;

  public dtOptions2: any = {};
  public gridOptions2: GridOptions<any> = {};
  public gridApi2?: GridApi<any>;
  public id_selected2: string = '';
  public is_deleted2: any = null;

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

    this.path = [
      {nombre: "Configuración", ruta: ""}, 
      {nombre: "Usuarios", ruta: "admin/usuarios"}, 
      {nombre: this.idusuario == "" ? "Nuevo" : "Edición", ruta: `admin/usuario/${this.idusuario}`}, 
    ];
  
    this.titulo = {icono: "fas fa-users",nombre: `Usuarios - ${this.idusuario == "" ? "Nuevo" : "Edición"}`}


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
    this.dataGridStruct2();
    
    if (this.user.idrol == 1){
      this.getClientes();
    }

    this.getGrupoUsuarios();
    this.getServidores();

    if (this.idusuario != ""){
      this.getData();
    }
  }

  ngOnDestroy(): void {
    this.func.encerarCampos(this.validador);
  }

  pagination(startIndex=0, endIndex=this.paginacion){
    this.lstSvrs = this.lstSvrs_original.slice(startIndex, endIndex);
    this.refreshAll();
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
          this.numero_servidores = this.rstData.servidores.length;
          this.email = this.rstData.email;
          this.grupo_usuario = this.rstData.grupo.nombre;
          this.ultimo_logueo = this.rstData.ultimo_logueo;

          this.lstSvrs_original = this.rstData.servidores;
          this.lstSvrs = Array.from(this.lstSvrs_original);
          this.refreshAll();
          // this.pagination();
          // setTimeout(()=>{
          //   this.pagination(0,this.lstSvrs_original.length)
          // },1000)

          // this.myDataSource = {
          //   getRows: (params: IGetRowsParams) => {
          //     setTimeout(() => {
          //       const rowsThisPage = this.lstSvrs.slice(params.startRow, params.endRow);
          //       let lastRow = -1;
          //       if (this.lstSvrs.length <= params.endRow) {
          //         lastRow = this.lstSvrs.length;
          //       }
          //       params.successCallback(rowsThisPage, lastRow);
          //     }, 500);
          //   }
          // }
          // this.gridApi!.setGridOption("datasource", this.myDataSource);
          
        } else {
          this.func.showMessage("error", "Usuario", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
        this.func.handleErrors("Usuarios", err);
      },
    });
  }

  getGrupoUsuarios(){
    this.lstGrupoUsuarios = [];

    this.grupoSvc.getAllFromClient(this.idcliente).subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.lstGrupoUsuarios = resp.data;
          this.idgrupo_usuario = this.lstGrupoUsuarios[0].idgrupo_usuario;
        } else {
          this.func.showMessage("error", "Grupo de Usuario", resp.message);
        }
      },
      error: (err: any) => {
        this.func.handleErrors("Usuarios", err);
      },
    });
  }


  getClientes(){
    this.lstClientes = [];

    this.clientesSvc.getAll().subscribe({
      next: (resp: any) => {
        // console.log(resp)
        if (resp.status) {
          this.lstClientes = resp.data;
          this.idcliente = this.lstClientes[0].idcliente;
          this.getGrupoUsuarios();
        } else {
          this.func.showMessage("error", "Clientes", resp.message);
        }
      },
      error: (err: any) => {
        this.func.handleErrors("Usuarios", err);
      },
    });
  }

  getServidores(){
    this.lstServidores = [];

    this.servidoresSvc.getAll().subscribe({
      next: (resp: any) => {
        if (resp.status) {
          resp.data.forEach((e:any) => {
            resp.check = false;
            this.lstServidores_Original.push(e);
          });
          // this.lstServidores = Array.from(this.lstServidores_Original);
          // this.refreshAll2()
        } else {
          this.func.showMessage("error", "Servidores", resp.message);
        }
      },
      error: (err: any) => {
        this.func.handleErrors("Usuarios", err);
      },
    });
  }

  funcSubmit(){
    let data = {
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

    if (this.func.validaCampos(this.validador, data)){
      return;
    }

    let param = {data};

    let method = "POST"
    let url = "usuario"
    if (this.idusuario != "") {
      method = "PUT";
      url += `/${this.idusuario}`
    }

    this.func.showLoading('Guardando');

    this.generalSvc.apiRest(method,  url,  data).subscribe({
      next: (resp: any) => {
        console.log(resp)
        this.func.closeSwal();
        if (resp.status) {
          setTimeout(()=>{
            this.funcCancelar();
          },800)
        } else {
          this.func.showMessage("error", "Usuario", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
        this.func.handleErrors("Usuarios", err);
        console.log(err)
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
            e.ubicacion.toLowerCase().indexOf(this.buscar.toLowerCase())>-1 ||
            e.host.toLowerCase().indexOf(this.buscar.toLowerCase())>-1 ||
            e.ssh_puerto.toString().indexOf(this.buscar.toLowerCase())>-1  ||
            e.agente_puerto.toString().indexOf(this.buscar.toLowerCase())>-1 
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
      pagination: true,
      paginationPageSize: this.paginacion,
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
        // {
        //   headerName: "ID",
        //   maxWidth: 100,
        //   // it is important to have node.id here, so that when the id changes (which happens
        //   // when the row is loaded) then the cell is refreshed.
        //   valueGetter: "node.id",
        //   cellRenderer: (params: ICellRendererParams) => {
        //     if (params.value !== undefined) {
        //       return params.value;
        //     } else {
        //       return '<img role="img" src="https://www.ag-grid.com/example-assets/loading.gif">';
        //     }
        //   },
        // },
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
          field: 'ssh_puerto',
          cellClass: 'text-start',
          filter: true,
        },
        {
          headerName: 'Agente',
          headerClass: ["th-center", "th-normal"],
          field: 'agente_puerto',
          cellClass: 'text-start',
          filter: true,
        },
        {
          headerName: 'Accion',
          headerClass: ["th-center", "th-normal"],
          field: 'idtemplate_comando',
          cellClass: 'text-start',
          cellRenderer: this.renderAccion.bind(this),
          autoHeight: true,
          filter: false,
          maxWidth:100,
        },

      ],
      // rowBuffer: 0,
      // // tell grid we want virtual row model type
      // rowModelType: "infinite",
      // // how big each page in our page cache will be, default is 100
      // cacheBlockSize: 100,
      // // how many extra blank rows to display to the user at the end of the dataset,
      // // which sets the vertical scroll and then allows the grid to request viewing more rows of data.
      // // default is 1, ie show 1 row.
      // cacheOverflowSize: 2,
      // // how many server side requests to send at a time. if user is scrolling lots, then the requests
      // // are throttled down
      // maxConcurrentDatasourceRequests: 1,
      // // how many rows to initially show in the grid. having 1 shows a blank row, so it looks like
      // // the grid is loading from the users perspective (as we have a spinner in the first col)
      // infiniteInitialRowCount: 1000,
      // // how many pages to store in cache. default is undefined, which allows an infinite sized cache,
      // // pages are never purged. this should be set for large data to stop your browser from getting
      // // full of data
      // maxBlocksInCache: 10,
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
    this.gridApi!.setGridOption('rowData', this.lstSvrs);
    this.gridApi!.refreshCells(params);
    // this.gridOptions.autoSizeStrategy;
  }

  dataGridStruct2() {
    let that = this;
    this.gridOptions2 = {
      rowData: [],
      pagination: true,
      paginationPageSize: this.paginacion,
      paginationPageSizeSelector: [5, 10, 50, 100, 200, 300, 1000],
      rowHeight: 50,
      suppressAutoSize:true, 
      defaultColDef: {
        flex: 1,
        minWidth: 100,
        filter: true,
        headerClass: 'bold',
        floatingFilter: true,
        resizable: false,
        sortable: true,
      },
      onRowClicked: (event: any) => {
        this.id_selected2 = event.data.idservidor;
      },
      rowDragManaged: false,
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
          field: 'ssh_puerto',
          cellClass: 'text-start',
          filter: true,
        },
        {
          headerName: 'Agente',
          headerClass: ["th-center", "th-normal"],
          field: 'agente_puerto',
          cellClass: 'text-start',
          filter: true,
        },
        {
          headerName: 'Accion',
          headerClass: ["th-center", "th-normal"],
          field: 'idtemplate_comando',
          cellClass: 'text-start',
          cellRenderer: this.renderAccion2.bind(this),
          autoHeight: true,
          filter: false,
          maxWidth:100,
        },
      ],
    };

    that.gridApi2 = createGrid(
      document.querySelector<HTMLElement>('#myGrid2')!,
      this.gridOptions2
    );
  }

  refreshAll2() {
    var params = {
      force: true,
      suppressFlash: true,
    };
    this.gridApi2!.setGridOption('rowData', this.lstServidores);
    this.gridApi2!.refreshCells(params);
    // this.gridOptions.autoSizeStrategy;
  }

  renderAccion(params: ICellRendererParams) {
    const button = document.createElement('button');
    button.className = 'btn btn-link text-danger';
    button.innerHTML = '<i role="img" class="far fa-trash-alt"></i>';
    button.addEventListener('click', () => {
      this.quitar(params.data.idservidor);
    });
    return button;
  }

  renderAccion2(params: ICellRendererParams) {
    if (params.data.check){
      return "<i>Asignado</i>";
    }else{
      const button = document.createElement('button');
      button.className = 'btn btn-link text-primary';
      button.innerHTML = '<i role="img" class="fas fa-plus-circle t20"></i>';
      button.addEventListener('click', () => {
        this.addItem(params.data.idservidor);
      });
      return button;
    }
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
        // try{
        //   this.lstServidores[idx].check = true;
        // }catch(ex){}
        // this.lstServidores_Original[idx].check = true;
      }
    })
    this.refreshAll();
    this.actualizaServidores();
  }

  actualizaServidores(){
    let found = false;
    this.lstServidores = [];
    this.lstServidores_Original.forEach(s=>{
      found = false;
      this.lstSvrs.forEach( (e,idx)=>{
        if (e.idservidor == s.idservidor){
          found = true;
        }
      })
      // s.check = found;
      if (!found){
        this.lstServidores.push(s)
      }
    })
    // this.lstServidores = Array.from(this.lstServidores_Original);
    this.refreshAll2()
  }


}
