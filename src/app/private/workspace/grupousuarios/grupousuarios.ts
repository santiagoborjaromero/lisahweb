import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
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
import { createGrid, GridApi, GridOptions, ICellRendererParams } from 'ag-grid-community';
import { GrupoUsuarioService } from '../../../core/services/grupousuarios.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-grupousuarios',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './grupousuarios.html',
  styleUrl: './grupousuarios.scss',
  standalone: true
})
export class Grupousuarios implements OnInit{
  private readonly route = inject(ActivatedRoute);
  private readonly sessions = inject(Sessions);
  private readonly func = inject(Functions);
  private readonly serverSvc = inject(ServidorService);
  private readonly agente = inject(WSService);
  private readonly parent = inject(Workspace);
  private readonly grupoSvc = inject(GrupoUsuarioService);
  // private readonly cdRef = inject(ChangeDetectorRef);

  Title = "Grupo de Usuarios";
  TAB = "grupousuarios"
  area = "grupos";

  user:any | undefined;
  work:any | undefined;
  icono = iconsData;

  lstGU:Array<any> = [];
  lstComandos:any  = [];
  lstUsuarios:any  = [];
  // sentinel_status = signal<string>("");
  global = Global;

  public dtOptions: any = {};
  public gridOptions: GridOptions<any> = {};
  public gridApi?: GridApi<any>;
  public id_selected: string = '';
  public name_selected: string = '';
  public is_deleted: any = null;
  
  /**
   * Sentinel
  */
  agente_status: string = "Desconectado";
  ws: any;
  reconnect: boolean = false;
  light_ws: boolean = false;
  lstGrupoUsuarios:any = [];
  ws_error:number = 0;
  ws_error_limit:number = 3;

  constructor(){
    this.parent.findTab(this.TAB);
  }

  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get("user"));
    this.work = JSON.parse(this.sessions.get("work"));
    this.dataGridStruct();
    this.getDataUsuarios();

    setTimeout(()=>{
      this.getData();
      this.openWS();
    },800)
  }

  
  ngOnDestroy(): void {
    this.ws.close(1000);
    this.ws = null;
  }


  getData() {
    this.lstGU = [];
    this.func.showLoading('Cargando');
    this.id_selected = '';
    this.is_deleted = '';

    this.grupoSvc.getAll().subscribe({
      next: (resp: any) => {
        // console.log(resp);
        this.func.closeSwal();
        if (resp.status) {
          this.lstGU = resp.data;
          this.refreshAll();
          this.startMonitor();
        } else {
          this.func.handleErrors("Server", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
        this.func.handleErrors("Grupo de Usuarios", err);
      },
    });
  }

  getDataUsuarios() {
    this.lstUsuarios = [];
    this.func.showLoading('Cargando');

    this.serverSvc.getOneWithUsers(this.work.idservidor).subscribe({
      next: (resp: any) => {
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
        } else {
          this.func.handleErrors("Server", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
        this.func.handleErrors("Redes", err);
      },
    });
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
        this.id_selected = event.data.idgrupo_usuario;
        this.name_selected = event.data.nombre;
      },
      // autoSizeStrategy: {
      //   type: 'fitCellContents',
      // },
      
      columnDefs: [
        {
          headerName: 'ID',
          headerClass: ["th-center", "th-normal"],
          field: 'idgrupo_usuario',
          filter: false,
          maxWidth:80
        },
        {
          headerName: 'Nombre',
          headerClass: ["th-center", "th-normal"],
          field: 'nombre',
          cellClass: 'text-start',
          filter: true,
        },
        {
          headerName: 'Servidor',
          headerClass: ["th-center", "th-normal2"],
          children:[
            {
              headerName: 'ID',
              headerClass: ["th-center", "th-normal"],
              field: 'gid',
              cellClass: 'text-start',
              filter: true,
              maxWidth: 100
            },
            {
              headerName: 'Grupo',
              headerClass: ["th-center", "th-normal"],
              field: 'grupo',
              cellClass: 'text-start',
              filter: true,
              cellRenderer: (params: ICellRendererParams) => {
                let icono = "times";
                let texto = "No existe";
                let color = "text-danger";
                if (params.value != "0"){
                  icono = "check";
                  texto = params.value;
                  color = "text-success";
                }
                return `<i role="img" class="fas fa-${icono}-circle ${color} t16 mr-2"></i> ${texto}`;
              },
            },
          ]
        },
        {
          headerName: 'Accion',
          headerClass: ["th-center", "th-normal"],
          cellClass: 'text-start',
          filter: true,
          flex: 3,
          maxWidth:100,
          cellRenderer: this.renderAcciones.bind(this),
        },
      ],
    };

    that.gridApi = createGrid(document.querySelector<HTMLElement>('#myGrid')!, this.gridOptions );
  }

  refreshAll() {
    let found=false;
    let obj:any = null;

    this.lstGU.forEach((gu)=>{
      found = false;
      this.lstGrupoUsuarios.forEach((s:any)=>{
        if (gu.nombre == s.grupo){
          found = true;
          obj = s;
        }
      })

      if (found){
        gu.gid = obj.gid;
        gu.grupo = obj.grupo;
      } else{
        gu.gid = "";
        gu.grupo = 0;
      }
    })

    var params = {
      force: true,
      suppressFlash: true,
    };
    this.gridApi!.refreshCells(params);
    this.gridApi!.setGridOption('rowData', this.lstGU);
    // this.gridApi!.autoSizeAllColumns();
  }

  renderAcciones(params: ICellRendererParams) {
    let button: any | undefined;
    if (params.data.gid){
    }else{
      button = document.createElement('button');
      button.className = 'btn btn-white';
      button.innerHTML = `<i role="img" class="fas fa-plus text-primary" title='Crear Grupo'></i>`;
      button.addEventListener('click', () => {
        this.crearGrupo(params.data.nombre);
      });
    }
    return button;
  }

  crearGrupo = (id="") => {
    if (this.id_selected == "" && id == ""){
      return
    }

    if (id != ""){
      this.id_selected = id;
    }

    Swal.fire({
      allowOutsideClick: false,
      allowEscapeKey: false,
      title: 'Grupo de Usuarios',
      text: `Seleccione la acción para crear el grupo de usuarios`,
      icon: 'question',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonColor: '#33a0d6',
      confirmButtonText: 'Crear ahora',
      denyButtonColor: '#2fb990ff',
      denyButtonText: 'Crear después',
      cancelButtonColor: '#f63c3a',
      cancelButtonText: 'Cancelar',
      showClass: { backdrop: 'swal2-noanimation', popup: '' },
      hideClass: { popup: '' },
    }).then((res) => {
      if (res.isConfirmed) {
        
      }else if(res.isDenied){

      }
    });
  }
  crearAhora(){
    let nombre = "";
    let lstCmd:any = [];
    this.lstGU.forEach(g=>{
      if (g.idgrupo_usuario == this.id_selected){
        nombre = g.nombre;
        lstCmd = g.scripts.cmds;
      }
    })

    if (lstCmd && lstCmd.length>0){
      let cmds:any = [];
      lstCmd.forEach((e:any) => {
        cmds.push({
          id: e.idtemplate_comando,
          cmd: e.linea_comando
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
        data: cmds
      };
      this.onSendCommands(params);
    }else{
      this.ejecutaOperaciones([{accion: "crear", grupo: nombre}]);
    }
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
    if (event.type == 'open') {
      console.log(`√ Conectado ${this.work.idservidor}`);
      this.agente_status = "Conectado";
      this.work.healthy_agente = 'OK|Conectado';
    } else {
      this.agente_status = "No se estableció conexion con Sentinel";
      console.log(`X Desconectado ${this.work.idservidor}`);
      this.work.agente_status = 'FAIL|Desconectado';
    }
  }

  onCloseListener(event: any) {
    // console.log('onCloseListener', event);
    console.log("█ Desconectado")
    console.log(`X Desconectado ${this.work.idservidor}`);
    if (event.code == 1000){
      this.agente_status = "Desconectado manualmente";
      this.ws_error = 0;
    }else{
      this.work.healthy_agente = 'FAIL|Desconectado';
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
    console.log(`↓ LlegoMensaje ${this.work.idservidor}`);
    let data = JSON.parse(e.data);
    // console.log(data)
    this.func.closeSwal()
    let r = "";
    let acum:any = [];
    let aux:any | undefined;
    data.data.forEach((d:any)=>{
      d.respuesta= atob(d.respuesta);
      switch(d.id){
        case "grupos|listar":
          let rd:any = (d.respuesta.split("\n"));
          rd.forEach((rs:any)=>{
            let rss = rs.split(":");
            if (rss[0]!="") acum.push(rss)
          })
          acum.forEach((u:any)=>{
            this.lstGrupoUsuarios.push({
              gid: u[2],
              grupo: u[0],
            })
          });
          this.refreshAll();
          break;
      }
    })
  }

  startMonitor(){
    this.ejecutaOperaciones([{accion: "listar", grupo: ""}]);
  }

  ejecutaOperaciones(acciones:any=[]){
    let cmds:any = [];
    acciones.forEach((cmp:any)=>{
      console.log(`→ ${cmp.accion} ←`)
      switch(cmp.accion){
        default:
          let cmd:any = this.buscarComando(this.area,cmp.accion, cmp.grupo);
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
        id: Math.floor(Math.random() * (9999999999999999 - 1000000000000000 + 1)) + 1000000000000000
      },
      data: cmds
    };
    this.onSendCommands(params);
  }

  buscarComando(area="", accion="", grupo=""){
    let arr:any = [];
    this.lstComandos.forEach((c:any)=>{
      if (c.area == area && c.accion == accion){
        arr.push({
          id: `${c.area}|${c.accion}`,
          cmd: this.parser(c.comando, grupo)
        });
      }
    })
    return arr;
  }

   parser(linea:string, grupo=""){
    let l = linea;
    if (l.indexOf("{nombre_grupo}")>-1){
      l = l.replace(/{nombre_grupo}/gi, grupo);
    }
    return l
  }


  onSendCommands(params:any=null){
    // this.func.showLoading("Cargando");
    if (this.connState()){
      console.log("↑ Enviando")
      this.ws.send(JSON.stringify(params));
    }else{
      this.openWS();
      setTimeout(()=>{
        this.onSendCommands(params)
      },1000)
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

