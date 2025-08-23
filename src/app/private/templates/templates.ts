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
import { GeneralService } from '../../core/services/general.service';

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
  private readonly generalSvc = inject(GeneralService);

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
  lstVariables: Array<any> = [];
  lstServidores: Array<any> = [];
  lstUsuarios: Array<any> = [];
  lstGrupoUsuarios: Array<any> = [];
  idServidor: number = 0;
  server:any = {};
  usuario:any = {};

  comando: string = "";

  /**
   * Sentinel
  */
  agente_status: string = "Desconectado";
  ws: any;
  reconnect: boolean = false;
  light_ws: boolean = false;
  ws_error:number = 0;
  ws_error_limit:number = 3;

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
    this.getGrupoUsuarios();
    this.getUsuarios();

    setTimeout(() => {
      this.getData();
    }, Global.times[0]);
  }

  getData() {
    this.lstData = [];
    this.tempSvc.getAllFilters(this.accion).subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.lstData = resp.data;

          this.refreshAll();
        } else {
          this.func.handleErrors("Templates", resp.message);
        }
      },
      error: (err: any) => {
        this.func.handleErrors("Templates", err);
      },
    });
  }

  getUsuarios() {
    this.lstServidores = [];

    this.generalSvc.apiRest("GET", `usuarios`).subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.lstUsuarios = resp.data;
          this.lstUsuarios.forEach(u=>{
            if (u.idusuario == this.user.idusuario){
              this.usuario = u;
              u.servidores.forEach((s:any)=>{
                this.lstServidores.push(s)
              })
            }
          })
        } else {
          this.func.showMessage("error", "Usuarios", resp.message);
        }
      },
      error: (err: any) => {
        this.func.handleErrors("Usuarios", err);
      },
    });
  }

  getGrupoUsuarios() {
    this.lstData = [];

    this.generalSvc.apiRest("GET", "grupousuarios").subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.lstGrupoUsuarios = resp.data;
        } else {
          this.func.handleErrors("Grupo Usuarios", resp.message);
        }
      },
      error: (err: any) => {
        this.func.handleErrors("Grupo Usuarios", err);
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
          headerName: 'Eliminar',
          headerClass: ["th-center", "th-normal"],
          cellClass: 'text-start',
          filter: true,
          flex: 3,
          maxWidth:80,
          cellRenderer: this.renderAcciones.bind(this),
        },
        {
          headerName: 'Ejecutar',
          headerClass: ["th-center", "th-normal"],
          cellClass: 'text-start',
          filter: true,
          flex: 3,
          maxWidth:80,
          cellRenderer: this.renderEjecutar.bind(this),
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

  renderEjecutar(params: ICellRendererParams) {
    let button: any | undefined;

    button = document.createElement('button');
    button.className = 'btn btn-white';
    button.innerHTML = `<i role="img" class="fa fa-play text-info t20" title='Ejecutar'></i>`;
    button.addEventListener('click', () => {
      this.procesoEspecial('ejecutar un comando', 'ejecutar', params.data.idtemplate_comando)
      // this.procesoEjecutar(params.data.idtemplate_comando)
    });
  
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
        }else if(keyword == "ejecutar"){
          this.procesoEjecutar();
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

  procesoEjecutar() {
    let found = false;
    this.comando = "";
    this.lstData.forEach((e:any)=>{
      if (e.idtemplate_comando == this.id_selected){
        this.comando = e.linea_comando;
        found = true;
      }
    })

    if (found){
      this.prepare()
    }
  }

  async prepare(){
    let html = "";

    html += `<select class="form-control" id="servidor">`
    this.lstServidores.forEach(s=>{
      html += `<option value="${s.idservidor}">${s.nombre}</option>`;
    })
    html += `</select>`;

    
    Swal.fire({
      allowOutsideClick: false,
      allowEscapeKey: false,
      title: "Seleccione un servidor",
      html: html,
      confirmButtonColor: '#33a0d6',
      confirmButtonText: 'Confirmar',
      cancelButtonColor: '#f63c3a',
      cancelButtonText: 'Cancelar',
      // footer: Global.acronym + " " + Global.appversion,
      showClass: { backdrop: 'swal2-noanimation', popup: '' },
      hideClass: { popup: '' },
      preConfirm: () => {
        let popup = Swal.getPopup();
        let valDat = "";
        if (popup){
          let obj = popup.querySelector('#servidor');
          if (obj){
            valDat = (obj as HTMLInputElement).value;
          }
          return valDat ? valDat : Swal.showValidationMessage( `You need to select one o more campaigns` );
        }
      },
    }).then((res) => {
      if (res.isConfirmed) {
        this.idServidor = parseInt(res.value);
        this.selectServer();
      }
    });
  }

  selectServer(){
    let found = false;
    this.lstServidores.forEach(s=>{
      if (s.idservidor == this.idServidor){
        this.server = s;
        found = true;
      }
    })

    if (found){
      

      this.openWS();
    }
  }

  openWS() {
    this.agente_status = "Conectando ...";
    const token = this.sessions.get('token');
    let url = `ws://${this.server.host}:${this.server.agente_puerto}/ws?token=${token}`;
    try{
      this.ws = new WebSocket(url);
      this.ws.onopen = (event: any) => this.onOpenListener(event);
      this.ws.onmessage = (event: any) => this.onMessageListener(event);
      this.ws.onclose = (event: any) => this.onCloseListener(event);
      this.ws.onerror = (event: any) => this.onErrorListener(event);
    }catch(ex){}
  }

  onOpenListener(event: any) {
    if (event.type == 'open') {
      console.log(`√ Conectado ${this.idServidor}`);
      this.agente_status = "Conectado";
      this.connState();
      this.startMonitor()
    } else {
      this.agente_status = "No se estableció conexion con Sentinel";
      console.log(`X Desconectado ${this.idServidor}`);
      this.agente_status = 'FAIL|Desconectado';
    }
  }

  onCloseListener(event: any) {
    console.log("█ Desconectado")
    console.log(`X Desconectado ${this.idServidor}`);
    if (event.code == 1000){
      this.agente_status = "Desconectado manualmente";
      this.ws_error = 0;
    }else{
      this.agente_status = "Desconectado";
      if (this.reconnect && this.ws_error < this.ws_error_limit){
        this.ws_error ++;
        setTimeout(()=>{
          this.startMonitor();
        },1000)
      }
    }
  }

  onErrorListener(event: any) {}

  onMessageListener(e:any){
    console.log(`↓ LlegoMensaje ${this.idServidor}`);
    let evento = JSON.parse(e.data);
    // console.log(evento)
    let data:any = evento.data;
    let resp = "";
    data.forEach( (e:any) => {
      resp += atob(e.respuesta) + "\n"
    });
    this.func.showMessage("info", "Comandos", resp)
  }

  connState = () => {
    let m = false;

    if (this.ws === undefined){
       m = false;
    }else{
      try{
        switch (this.ws.readyState){
          case 0:
            //m = "Pepper has been created. The connection is not yet open.";
            m = false;
            break;
          case 1:
            //m = "The connection is open and ready to communicate.";
            m = true;
            break;
          case 2:
            //m = "The connection is in the process of closing.";
            m = false;
            break;
          case 3:
            //m = "The connection is closed or couldn't be opened.";
            m = false;
            break;
        }
      }catch(err){
        m = false;
      }
    }

    this.light_ws = m;
    return m;
  }


  startMonitor(){

    if (this.comando.indexOf("{nombre_servidor}")>-1){
      this.comando = this.comando.replace(/{nombre_servidor}/gi, this.server.nombre);
    }

    if (this.comando.indexOf("{usuario}")>-1){
      this.comando = this.comando.replace(/{nombre_servidor}/gi, this.usuario.usuario);
    }

    if (this.comando.indexOf("{grupo_nombre}")>-1){
      this.comando = this.comando.replace(/{grupo_nombre}/gi, this.usuario.grupo.nombre);
    }

    if (this.comando.indexOf("{usuario_clave}")>-1){
      this.func.showMessage("error", "Comandos", "No puede enviarse un comando que incluya la contraseña, por favor dirijase a Administracion de servidores.");
      return
    }


    let params = {
      action: "comando",
      identificador: {
        idcliente: this.user.idcliente,
        idusuario: this.user.idusuario,
        usuario: this.user.usuario,
        idservidor: this.idServidor,
        id: Math.floor(Math.random() * (9999999999999999 - 1000000000000000 + 1)) + 1000000000000000
      },
      data: [
        {"id": "comandos screen", "cmd": this.comando},
      ]
    };
    this.onSendCommands(params);
  }

  onSendCommands(params:any=null){
    if (this.connState()){
      console.log("↑ Enviando")
      this.ws.send(JSON.stringify(params));
    }
  }



  
}
