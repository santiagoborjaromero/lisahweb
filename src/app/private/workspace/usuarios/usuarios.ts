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
  private readonly route = inject(ActivatedRoute);
  private readonly sessions = inject(Sessions);
  private readonly func = inject(Functions);
  private readonly serverSvc = inject(ServidorService);
  private readonly cfgSvc = inject(ConfigService);
  private readonly scriptSvc = inject(ScriptsService);
  private readonly userSvc = inject(UsuarioService);
  private readonly agente = inject(WSService);
  private readonly parent = inject(Workspace);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly encrypt = inject(Encryption);

  Title = 'Usuarios';
  TAB = 'usuarios';

  user: any | undefined;
  work: any | undefined;
  icono = iconsData;
  area = "usuarios";

  rstConfig: any = null;
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

  constructor() {
    this.parent.findTab(this.TAB);
    this.lstDatos = {
      agente_status: '',
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
        subtitulo: "Remueve el usuario pero no su carpeta",
        condicion: true
      },
      {
        accion: "eliminar_completo", 
        titulo: "Eliminar Usuario - Full", 
        subtitulo: "Remueve el usuario incluido su carpeta",
        condicion: true
      },
    ];
  }


  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get('user'));
    this.work = JSON.parse(this.sessions.get('work'));

    this.dataGridStruct();
    
    setTimeout(()=>{
      // this.openConn();
      this.initial();
    },300)
  }
  
  initial(){
    this.id_selected = "";
    this.name_selected = "";
    this.user_selected = null;
    this.is_deleted = "";
    this.getDataUsuarios();
    this.getDataConfiguracion();
  }

  getDataUsuarios() {
    this.lstUsuarios = [];
    this.func.showLoading('Cargando');
    this.id_selected = '';
    this.is_deleted = '';

    this.serverSvc.getOneWithUsers(this.work.idservidor).subscribe({
      next: (resp: any) => {
        // console.log(resp)
        this.func.closeSwal();
        if (resp.status) {
          if (resp.data[0].usuarios.length > 0){
            resp.data[0].usuarios.forEach((e:any)=>{
              e["servidor"] = null;
              this.lstUsuarios.push(e)
            })
          }
          if (resp.data[0].comandos.length > 0){
            this.lstComandos = resp.data[0].comandos;
          }
          // console.log("↓Srv",this.lstUsuarios)
          // console.log("↓",this.lstComandos)
          this.refreshAll();
          this.ejecutaOperaciones("listar");
        } else {
          this.func;
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
      },
    });
  }

  getDataConfiguracion() {
    this.cfgSvc.getAll().subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.rstConfig = resp.data[0];
        } else {
          this.func.showMessage("error", "Configuracion", resp.message);
        }
      },
      error: (err: any) => {
        this.func.showMessage("error", "Configuracion", err);
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

  openConn(data:any = null) {
    this.agente.connect(this.work).subscribe({
      next: (resp) => {
        // console.log('↓ Sentinel Status', resp);
        if (resp) {
          let result = resp.healthy_agente.split('|');
          this.lstDatos.agente_status = result[1];
          if (result[0] == 'OK') {
              this.onSendCommands(data);
          }
        }
      },
      error: (err) => {
        console.log('Error', err);
      },
    });
  }

  onSendCommands(params:any){
    this.agente.sendCommand(this.work.idservidor, params)
    .then(resp=>{
      this.lstDatos.usuarios = [];
      console.log("↓ Sentinel response", resp)
      if (resp){
        let data = resp.data.data;
        let r = "";
        let acum:any = [];
        let aux:any | undefined;
        // console.log("D", data)
        data.forEach((d:any)=>{
          switch(d.id){
            case `${this.area}|listar`:
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
              });
              // console.log(this.lstDatos.usuarios)
              this.checkUsers();
              break;
            default:
              // console.log("cargando Conexion")
              // console.log(resp)
              // this.ejecutaOperaciones("listar");
              this.initial();
              break;
          }
        })
      }
    })
    .catch(err=>{
      console.log(err)
    })
  }


  checkUsers(){
    if (this.lstDatos.usuarios.length>0){
      this.lstDatos.usuarios.forEach((e:any)=>{
        this.lstUsuarios.forEach((u:any)=>{
          if (e.user == u.usuario){
            u["servidor"] = e;
          }
        })
      });
      this.refreshAll();
      // console.log(this.lstUsuarios)
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
          // {
          //   headerName: 'Accion',
          //   headerClass: ["th-center", "th-normal"],
          //   cellClass: 'text-start',
          //   filter: true,
          //   flex: 3,
          //   maxWidth:100,
          //   cellRenderer: this.renderAcciones.bind(this),
          // },
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
    if (this.rstConfig){
      if (this.rstConfig.idscript_creacion_usuario){
        this.scriptSvc.getOne(this.rstConfig.idscript_creacion_usuario).subscribe({
          next: (resp: any) => {
            // console.log(resp)
            if (resp.status) {
              let d = resp.data[0];
              this.ejecutaCreacion(d.cmds);
            } else {
              this.func;
            }
          },
          error: (err: any) => {
          },
        });
      } else{
        this.func.showMessage("error","Usuarios", "No tiene asignado un script para la creacion de usuarios. Vaya a Configuracion / Configuración General y asigne un script existente")
      }
    } 

  }
  
  ejecutaCreacion(cmds:any){
    let c:any = [];
    cmds.forEach((e:any) => {
      c.push({
        id: e.idtemplate_comando,
        cmd: this.parser(e.linea_comando)
      })
    });
  
    let params = {
      action: "comando",
      identificador: {
        idcliente: this.user.idcliente,
        idusuario: this.user.idusuario,
        idservidor: this.work.idservidor,
        id: Math.floor(Math.random() * (9999999999999999 - 1000000000000000 + 1)) + 1000000000000000
      },
      data: c
    };
    // console.log(params)
    this.onSendCommands(params);
  
    // setTimeout(()=>{
    //   this.openConn();
    // },1000)
  }

  parser(linea:string){
    let l = linea;
    if (l.indexOf("{usuario}")>-1){
      l = l.replace(/{usuario}/gi, this.user_selected.usuario);
    }
    if (l.indexOf("{grupo_nombre}")>-1){
      l = l.replace(/{grupo_nombre}/gi, this.user_selected.grupo.nombre);
    }
    if (l.indexOf("{usuario_clave}")>-1){
      l = l.replace(/{usuario_clave}/gi, this.encrypt.decrypt(this.user_selected.clave));
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
          this.ejecutaOperaciones(que);
        }
      });
    }
  }

  ejecutaOperaciones(accion=""){
    console.log(`→ ${accion} ←`)
    let cmd:any = null;
    switch(accion){
      case "crear":
        /* 
        * Crear usuario, grupo y contraseña
        */
        this.creaUsuario(this.user_selected);
        return; 
      case "crear_clave":
        /**
         * Crear y actualizar contraseña
         */
        this.actualizaClave()
          .then((resp:any)=>{})
          .catch(err=>{
            this.func.showMessage("error", "Actualizar Contraseña",err);
          })
        break;
      default:
        cmd = this.buscarComando(this.area, accion);
        break;
    }

    console.log("↑", cmd)
    if (!cmd) return 
    let params = {
      action: "comando",
      identificador: {
        idcliente: this.user.idcliente,
        idusuario: this.user.idusuario,
        idservidor: this.work.idservidor,
        id: Math.floor(Math.random() * (9999999999999999 - 1000000000000000 + 1)) + 1000000000000000
      },
      data: cmd
    };
    this.openConn(params);
  }

  actualizaClave(){
    return new Promise((resolve, reject) => {
      this.userSvc.updatePass(this.user_selected.idusuario).subscribe({
        next: (resp: any) => {
          console.log(resp)
          if (resp.status) {
            this.user_selected.clave = resp.message;
            this.checkNovedades();
            resolve(this.user_selected.clave);
          } else {
            reject(resp.message)
          }
        },
        error: (err: any) => {
          reject(err)
        },
      });
    }) 
  }

  checkNovedades(){
    this.lstNotificaciones = [];

    // console.log(this.user_selected)

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


}
