import { Component, inject, OnInit, Sanitizer } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Sessions } from '../../../core/helpers/session.helper';
import { Functions } from '../../../core/helpers/functions.helper';
import { ServidorService } from '../../../core/services/servidor.service';
import { WSService } from '../../../core/services/ws.service';
import iconsData from '../../../core/data/icons.data';
import { Workspace } from '../workspace';
import { Global } from '../../../core/config/global.config';
import {
  AllCommunityModule,
  createGrid,
  GridApi,
  GridOptions,
  ICellRendererParams,
  ModuleRegistry,
} from 'ag-grid-community';
import { UsuarioService } from '../../../core/services/usuarios.service';
import { ConfigService } from '../../../core/services/config.service';
import { ScriptsService } from '../../../core/services/script.service';
import { DomSanitizer } from '@angular/platform-browser';
import Swal from 'sweetalert2';
import { Encryption } from '../../../core/helpers/encryption.helper';

export interface Datos {
  agente_status: string
  usuarios: any
}

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-usuarios',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class Usuarios implements OnInit {
  private readonly sessions = inject(Sessions);
  private readonly func = inject(Functions);
  private readonly serverSvc = inject(ServidorService);
  private readonly cfgSvc = inject(ConfigService);
  private readonly scriptSvc = inject(ScriptsService);
  private readonly userSvc = inject(UsuarioService);
  private readonly agente = inject(WSService);
  private readonly parent = inject(Workspace);
  private readonly encrypt = inject(Encryption);

  Title = 'Usuarios';
  TAB = 'usuarios';
  area = "usuarios";

  user: any | undefined;
  work: any | undefined;
  icono = iconsData;

  rstScriptCreacionUsuario: any = null;
  lstDatos: Datos;
  global = Global;
  lstUsuarios: Array<any> = [];
  lstComandos: Array<any> = [];
  noti: any = null;

  public dtOptions: any = {};
  public gridOptions: GridOptions<any> = {};
  public gridApi?: GridApi<any>;
  public id_selected: string = '';
  public name_selected: string = '';
  public user_selected: any = null;
  public is_deleted: any = null;

  lstAcciones: Array<any> = [];
  lstNotificaciones: Array<any> = [];

  ws_error:number = 0;
  ws_error_limit:number = 3;

  /**
   * Sentinel
  */
  agente_status: string = "Desconectado";
  ws: any;
  reconnect: boolean = true;
  light_ws: boolean = false;

  constructor() {
    this.parent.findTab(this.TAB);
    this.lstDatos = {
      agente_status: 'Desconectado',
      usuarios: []
    };
    this.lstAcciones = [
      {
        accion: "crear", 
        titulo:"Crear usuario, grupo y contraseña", 
        subtitulo: "",
        condicion: true,
      },
      {
        accion: "actualizar_clave", 
        titulo: "Actualizar contraseña en el servidor", 
        subtitulo: "",
        condicion: true
      },
      {
        accion: "crear_clave", 
        titulo: "Crear y actualizar contraseña", 
        subtitulo: "Crear la contraseña en el sistema y en el servidor. Se enviará una notificaicon con la nueva contraseña",
        condicion: true
      },
      {
        accion: "suspender", 
        titulo: "Suspender Usuario", 
        subtitulo: "Desactiva el acceso temporalmente al usuario en el servidor",
        condicion: true
      },
      {
        accion: "reactivar", 
        titulo: "Reactivar Usuario", 
        subtitulo: "Reactiva el acceso del usuario en el servidor",
        condicion: true
      },
      {
        accion: "eliminar", 
        titulo: "Eliminar Usuario", 
        subtitulo: "Remueve el usuario del sistema",
        condicion: true
      },
      {
        accion: "actualizar_grupo", 
        titulo: "Actualizar grupo de usuario", 
        subtitulo: "Actualiza el grupo al cual pertenece el usuario",
        condicion: true
      },

    ];
  }

  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get('user'));
    this.work = JSON.parse(this.sessions.get('work'));

    this.dataGridStruct();
    this.openWS();

    setTimeout(()=>{
      this.initial();
    },300)
  }

  ngOnDestroy(): void {
    this.ws.close(1000);
    this.ws = null;
  }
  
  initial(){
    this.id_selected = "";
    this.name_selected = "";
    this.user_selected = null;
    this.is_deleted = "";
    this.getDataUsuarios();
    // this.getDataConfiguracion();
  }

  getDataUsuarios() {
    this.lstUsuarios = [];
    this.func.showLoading('Cargando');
    this.id_selected = '';
    this.is_deleted = '';

    this.serverSvc.getOneWithUsers(this.work.idservidor).subscribe({
      next: (resp: any) => {
        // console.log("RESP USUARIOS ", resp)
        this.func.closeSwal();
        if (resp.status) {
          if (resp.data[0].usuarios.length > 0){
            resp.data[0].usuarios.forEach((e:any)=>{
              e["servidor"] = null;
              if (e.idgrupo_usuario){
                this.lstUsuarios.push(e)
              }
            })
          }
          if (resp.data[0].comandos.length > 0){
            this.lstComandos = resp.data[0].comandos;
          }
          this.rstScriptCreacionUsuario = resp.data[0].cliente.configuracion.script.cmds;
          this.refreshAll();
          this.ejecutaOperaciones([{accion:"listar", usuario: ""}]);
        } else {
          this.func.handleErrors("Server", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
      },
    });
  }

  buscarComando(area="", accion=""){
    let arr:any = [];
    this.lstComandos.forEach((c:any)=>{
      if (c.area == area && c.accion == accion){
        arr.push({
          id: `${c.area}|${c.accion}`,
          cmd: this.parser(c.comando)
        });
      }
    })
    return arr;
  }

  checkUsers(){
    if (this.lstDatos.usuarios.length>0){
      let found = false;
      this.lstUsuarios.forEach((u:any)=>{
        found = false;
        this.lstDatos.usuarios.forEach((e:any)=>{
          // console.log(e)
        if (e.user == u.usuario){
            u["servidor"] = e;
            found = true;
          }
        })
        if (!found){
          u["servidor"] = null;
        }
      });
      this.refreshAll();
    }
  }

  dataGridStruct() {
    let that = this;
    this.gridOptions = {
      rowData: [],
      pagination: true,
      paginationPageSize: 10,
      paginationPageSizeSelector: [5, 10, 50, 100, 200, 300, 1000],
      // rowSelection: 'single',
      rowHeight: 35,
      groupHeaderHeight: 35,
      headerHeight: 35,
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

      // skipHeaderOnAutoSize: true,
      onRowClicked: (event: any) => {
        this.id_selected = event.data.idusuario;
        // this.name_selected = event.data.nombre;
        this.user_selected = event.data;
        this.checkNovedades();
      },
      // autoSizeStrategy: {
      //   type: 'fitCellContents',
      // },
      columnDefs: [
        {
          headerName: 'ID',
          headerClass: 'th-normal',
          field: 'idusuario',
          cellClass: 'text-start',
          filter: false,
          // pinned: 'left',
          maxWidth:80
        },
        {
          headerName: 'nombre',
          headerClass: 'th-normal',
          field: 'nombre',
          cellClass: 'text-start',
          filter: true,
          // pinned: 'left',
        },
        {
          headerName: 'Usuario',
          headerClass: 'th-normal',
          field: 'usuario',
          cellClass: 'text-start',
          filter: true,
          // pinned: 'left',
        },
        {
          headerName: 'Grupo',
          headerClass: 'th-normal',
          field: 'grupo.nombre',
          cellClass: 'text-start',
          filter: true,
        },
        {
          headerName: 'Estado',
          headerClass: ["th-center", "th-normal"],
          field: 'estado',
          cellClass: 'text-start',
          maxWidth:80,
          cellRenderer: (params: ICellRendererParams) => {
            let data = params.data;
            let status = data.estado == 1 && data.deleted_at === null ? 1 : 0;
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
            headerName: 'Servidor',
            headerClass: ["th-center", "th-normal2"],
            children:[
              {
                headerName: 'ID',
                headerClass: ["th-center", "th-normal"],
                field: 'servidor.uid',
                cellClass: 'text-start',
                filter: true,
                maxWidth: 100
              },
              {
                headerName: 'Usuario',
                headerClass: ["th-center", "th-normal"],
                field: 'servidor.user',
                cellClass: 'text-start',
                filter: true,
                cellRenderer: (params: ICellRendererParams) => {
                  let icono = "times";
                  let texto = "No existe";
                  let color = "text-danger";
                  if (params.value && params.value != "0"){
                    icono = "check";
                    texto = params.value;
                    color = "text-success";
                  }
                  return `<i role="img" class="fas fa-${icono}-circle ${color} t16 mr-2"></i> ${texto}`;
                },
              },
              {
                headerName: 'GID',
                headerClass: 'th-normal',
                field: 'servidor.gid',
                cellClass: 'text-start',
                filter: true,
                maxWidth: 100,
              },
              {
                headerName: 'Grupo',
                headerClass: ["th-center", "th-normal"],
                field: 'servidor.group',
                cellClass: 'text-start',
                filter: true,
                cellRenderer: (params: ICellRendererParams) => {
                  let icono = "times";
                  let grupo_sistema = params.data.grupo.nombre;
                  let texto = params.value;
                  let color = "text-danger";
                  if (params.value == grupo_sistema){
                    icono = "check";
                    color = "text-success";
                  }
                  return `<i role="img" class="fas fa-${icono}-circle ${color} t16 mr-2"></i> ${texto}`;
                },
              },
              {
                headerName: 'Lock',
                headerClass: ["th-center", "th-normal"],
                field: 'servidor.pwdlock',
                cellClass: 'text-start',
                maxWidth:80,
                cellRenderer: (params: ICellRendererParams) => {
                  let icono = 'fas fa-lock';
                  let color = 'text-danger';
                  let text = "Suspendido";
                  if (params.value == "0") {
                    color = 'text-success';
                    icono = 'fas fa-unlock';
                    text = "Habilitado";
                  }
                  return `<i role="img" class="${color} ${icono} t20" title="${text}"></i>`;
                },
              },
            ]
          },

      ],
    };

    that.gridApi = createGrid(document.querySelector<HTMLElement>('#myGrid')!, this.gridOptions );
  }

  refreshAll() {
    var params = {
      force: true,
      suppressFlash: true,
    };
    this.gridApi!.refreshCells(params);
    this.gridApi!.setGridOption('rowData', this.lstUsuarios);
    // this.gridApi!.autoSizeAllColumns();
  }

  renderAcciones(params: ICellRendererParams) {
    let button: any | undefined;
    if (params.data.servidor == null){
      button = document.createElement('button');
      button.className = 'btn btn-white';
      button.innerHTML = `<i role="img" class="fas fa-plus text-primary" title='Crear Usuario'></i>`;
      button.addEventListener('click', () => {
        this.creaUsuario(params.data);
      });
    }
    return button;
  }

  creaUsuario(data:any){
    this.user_selected = data;
    let cmds:any = [];
    this.rstScriptCreacionUsuario.forEach((s:any) => {
      cmds.push({
        id: s.idtemplate_comando.toString(),
        cmd: this.parser(s.linea_comando)
      });
    });
    return cmds
  }

  parser(linea:string){
    let l = linea;
    if (l){
      if (l.indexOf("{usuario}")>-1){
        l = l.replace(/{usuario}/gi, this.user_selected.usuario);
      }
      if (l.indexOf("{grupo_nombre}")>-1){
        l = l.replace(/{grupo_nombre}/gi, this.user_selected.grupo.nombre);
      }
      if (l.indexOf("{usuario_clave}")>-1){
        l = l.replace(/{usuario_clave}/gi, this.encrypt.decrypt(this.user_selected.clave));
      }
    }
    return l
  }
  
  operaciones(que=""){
    let found = false;
    let leyenda = "";
    this.lstAcciones.forEach(c=>{
      if (c.accion == que){
        leyenda = c.titulo;
        found = true;
      }
    })

    if (found){
      Swal.fire({
        allowOutsideClick: false,
        allowEscapeKey: false,
        title: 'Pregunta',
        text: `Para ${leyenda}, debe escribir la palabra ${que}.`,
        icon: 'question',
        input: 'text',
        inputPlaceholder: que,
        showCancelButton: true,
        confirmButtonColor: '#33a0d6',
        confirmButtonText: 'Confirmar',
        cancelButtonColor: '#f63c3a',
        cancelButtonText: 'Cancelar',
        showClass: { backdrop: 'swal2-noanimation', popup: '' },
        hideClass: { popup: '' },
        inputValidator: (text) => {
          return new Promise((resolve) => {
            if (text.trim() !== '' && text.trim() == que) {
              resolve('');
            } else {
              resolve(`Para ${leyenda}, debe ingresar ${que}.`);
            }
          });
        },
      }).then((res) => {
        if (res.isConfirmed) {
          this.ejecutaOperaciones([{accion: que}]);
        }
      });
    }
  }

  ejecutaOperaciones(acciones:any=[]){

    let acc = "";

    let cmds:any = [];
    let cmd:any ;
    acciones.forEach((cmp:any)=>{
      console.log(`→ ${cmp.accion} ←`)
      acc = cmp.accion;
      switch(cmp.accion){
        case "crear":
          cmds = this.creaUsuario(this.user_selected);
          break;
        default:
          cmd = this.buscarComando(this.area,cmp.accion);
          if (Array.isArray(cmd)){
            cmd.forEach((e:any)=>{
              cmds.push(e)
            })
          }else{
            cmds.push(cmd)
          }
          break;
      }
    })

    // console.log("↑", cmds)
    if (!cmds) return 

    let params = {
      action: "comando",
      identificador: {
        idcliente: this.user.idcliente,
        idusuario: this.user.idusuario,
        idservidor: this.work.idservidor,
        usuario: this.user.usuario,
        id: Math.floor(Math.random() * (9999999999999999 - 1000000000000000 + 1)) + 1000000000000000
      },
      data: cmds
    };
    let time = 0;
    if (["suspender"].includes(acc)){
      time = 10;
    }
    this.onSendCommands(params, time);
  }


  checkNovedades(){
    this.lstNotificaciones = [];

    if (this.user_selected.servidor !== null){
      this.lstAcciones[0].condicion = false;
      this.lstAcciones[1].condicion = true;
      this.lstAcciones[2].condicion = false;
      if (this.user_selected.servidor.pwdlock == "1") {
        this.lstAcciones[3].condicion = false;
        this.lstAcciones[4].condicion = true;
      } else {
        this.lstAcciones[3].condicion = true;
        this.lstAcciones[4].condicion = false;
      }
      this.lstAcciones[5].condicion = true;
      this.lstAcciones[6].condicion = true;
    }else{
      this.lstNotificaciones.push({tipo: "FATAL", descripcion: "El usuario no se encuentra creado en el servidor"})
      this.lstAcciones[0].condicion = true;
      this.lstAcciones[1].condicion = false;
      this.lstAcciones[2].condicion = false;
      this.lstAcciones[3].condicion = false;
      this.lstAcciones[4].condicion = false;
      this.lstAcciones[5].condicion = false;
      this.lstAcciones[6].condicion = false;
    }

    if (!this.user_selected.clave){
      this.lstNotificaciones.push({tipo: "FATAL", descripcion: "El usuario no tiene definida una contraseña en el sistema"})
      this.lstAcciones[2].condicion = true;
    }

    // if (this.user_selected.email_confirmado == 0){
    //     this.lstNotificaciones.push({tipo: "FATAL", descripcion: "El usuario no tiene confirmado el correo electrónico"})
    // }

  }


  openWS() {
    this.agente_status = "Conectando ...";
    const token = this.sessions.get('token');
    let url = `ws://${this.work.host}:${this.work.agente_puerto}/ws?token=${token}`;
    try{
      this.ws = new WebSocket(url);
      this.ws.onopen = (event: any) => this.onOpenListener(event);
      this.ws.onmessage = (event: any) => this.onMessageListener(event);
      this.ws.onclose = (event: any) => this.onCloseListener(event);
      this.ws.onerror = (event: any) => this.onErrorListener(event);
    }catch(ex){}
  }

  onOpenListener(event: any) {
    this.connState();
    if (event.type == 'open') {
      console.log(`√ Conectado ${this.work.idservidor}`);
      this.agente_status = "Conectado";
      this.work.healthy_agente = 'OK|Conectado';
    } else {
      this.agente_status = "No se estableció conexion con Sentinel";
      console.log(`1X Desconectado ${this.work.idservidor}`);
      this.work.agente_status = 'FAIL|Desconectado';
    }
  }

  onCloseListener(event: any) {
    // console.log('onCloseListener', event);
    console.log(`X Desconectado ${this.work.idservidor}`);

    if (event.code == 1000){
      this.agente_status = "Desconectado manualmente";
      this.ws_error = 0;
    }else{
      this.ws_error ++;
      console.log(this.ws_error)
      this.func.closeSwal();
      this.work.healthy_agente = 'FAIL|Desconectado';
      this.agente_status = "Desconectado";
      if (this.ws_error < this.ws_error_limit){
        console.log("AJAJAJAJA", this.ws_error)
        // setTimeout(()=>{
        //   // this.startMonitor();
        // },3000)
      }
    }
  }

  onErrorListener(event: any) {}

  onMessageListener(e:any){
    console.log(`↓ LlegoMensaje ${this.work.idservidor}`);
    let data = JSON.parse(e.data);
    // console.log(data)
    this.func.closeSwal()
    let status = data.status;
    
    let r = "";
    let acum:any = [];
    let aux:any | undefined;
    data.data.forEach((d:any)=>{
      d.respuesta= atob(d.respuesta);

      if (!status){
        this.func.showMessage("error", "Usuarios", d.respuesta);
        return
      }

      switch(d.id){
        case `${this.area}|listar`:
          this.lstDatos.usuarios = [];

          let rd:any = (d.respuesta.split("\n"));
          rd.forEach((rs:any)=>{
            let rss = rs.split(":");
            if (rss[0]!="") acum.push(rss)
          })
          acum.forEach((u:any)=>{
            let gid1 = u[11].split(",");
            let grupo1 = u[10].split(",");
            let gid2 = u[13].split(",");
            let grupo2 = u[12].split(",");
            let gid = gid1.concat(gid2);
            let grupo = grupo1.concat(grupo2);

            let grupoid:Array<any> = [];
            gid.forEach((e:any)=>{
              if (e!=""){
                grupoid.push(e)
              }
            })
            let gruponombre:Array<any> = [];
            grupo.forEach((e:any)=>{
              if (e!=""){
                gruponombre.push(e)
              }
            })

            this.lstDatos.usuarios.push({
              user: u[0],
              uid: u[1],
              gecos: u[2],
              homedir: u[3],
              shell: u[4],
              nologin: u[5],
              pwdlock: u[6],
              pwdempty: u[7],
              pwddeny: u[8],
              pwdmethod: u[9],
              gid: grupoid.join(", "),
              group: gruponombre.join(", "),
              lastlogin: u[14],
              lasttty: u[15],
              lasthostname: u[16],
              failedlogin: u[17],
              failedtty: u[18],
              hushed: u[19],
              pwdwarn: u[20],
              pwdchange: u[21],
              pwdmin: u[22],
              pwdmax: u[23],
              pwdexpire: u[24],
              context: u[25],
              proc: u[26],

            })
            this.checkUsers();
          });
          break;
        default:
          this.startMonitor();
          break;
      }
    })
  }

  startMonitor(){
    this.id_selected = "";
    this.user_selected = null;
    this.ejecutaOperaciones([{accion: "listar", usuario: ""}]);
  }

  onSendCommands(params:any=null, time:number = 5){
    this.func.showLoading("Cargando", 10);

    console.log(this.connState())
    if (this.connState()){
      console.log("↑ Enviando");
      // console.log(JSON.stringify(params));
      this.ws.send(JSON.stringify(params));
    }else{
      // this.openWS();
      // setTimeout(()=>{
      //   this.onSendCommands(params, time)
      // },1000)
    }
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




}
