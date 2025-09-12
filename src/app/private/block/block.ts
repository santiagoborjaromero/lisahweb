import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AllCommunityModule, ModuleRegistry} from 'ag-grid-community';
import { ServidorService } from '../../core/services/servidor.service';
import { Functions } from '../../core/helpers/functions.helper';
import { Sessions } from '../../core/helpers/session.helper';
import { UsuarioService } from '../../core/services/usuarios.service';
import { WSService } from '../../core/services/ws.service';
import { Titulo } from '../shared/titulo/titulo';
import { Path } from '../shared/path/path';
import { GeneralService } from '../../core/services/general.service';
import moment from 'moment';


ModuleRegistry.registerModules([AllCommunityModule]);


@Component({
  selector: 'app-block',
  imports: [Titulo, Path, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './block.html',
  styleUrl: './block.scss'
})
export class Block {
  private readonly generalSvc = inject(GeneralService);
  private readonly serverSvc = inject(ServidorService);
  private readonly func = inject(Functions);
  private readonly sessions = inject(Sessions);
  private readonly wsSvc = inject(WSService);

  private connection = new Map<number, any>();
  private connection_status = new Map<number, any>();

  user: any = null;
  path:any = [];
  titulo:any = {icono: "",nombre:""}
  canR: boolean = true;
  canW: boolean = true;
  canD: boolean = true;

  serverIndex: number = 0;
  revisando: any;
  continuar: any;
  
  lstServidores: Array<any> = [];
  lstServidores_O: Array<any> = [];
  
  displayExporta: boolean = false;

  oBuscarServer:string = "";
  oBuscarScripts:string = "";
  oBuscarComandos:string = "";
  
  lstScripts_O:any = [];
  lstScripts:any = [];
  lstComandos:any = [];
  lstComandos_O:any = [];
  lstCmd:any = [];
  lstProgreso:any = [];
  lstLogs:any = [];
  lstSend:any = [];
  
  timeline:any = [];

  ws:any;

  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get('user'));
    this.path = [
      {nombre: "Admin & Hardening", ruta: ""}, 
      {nombre: "Procesos en Bloque", ruta: "admin/block"}, 
    ];
  
    this.titulo = {icono: "fas fa-terminal",nombre: "Procesos en Bloque"}

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

    this.timeline = [
      {nombre: "Servidores", trigger: "div_servidores", status: true},
      {nombre: "Scripts", trigger: "div_scripts", status: false},
      {nombre: "Comandos", trigger: "div_comandos", status: false},
      {nombre: "Resumen", trigger: "div_resumen", status: false},
      {nombre: "Ejecución", trigger: "div_ejecucion", status: false},
    ]

    if (this.user.grupo){
      this.getUsuario();
    }else{
      this.listaTodosServidores();
    }
    this.getScripts();
    this.getComandos();
  }

  ngOnDestroy(): void {
  }

  getUsuario() {
    this.lstServidores = [];
    this.func.showLoading('Cargando Servidores del Usuario');

    this.generalSvc.apiRest("GET", `usuarios/${this.user.idusuario}`).subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        if (resp.status) {
          if (resp.data[0].servidores && resp.data[0].servidores.length > 0) {
            resp.data[0].servidores.forEach((s:any)=>{
              if (s.estado == 1){
                s["checked"] = false;
                this.lstServidores.push(s)
              }
            })
          }
        } else {
          this.func.showMessage("error", "Usuario", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
        this.func.handleErrors("Hardening", err);
      },
    });
  }

  listaTodosServidores() {
    /**
     * lista de todos los servidores
     */    
    this.lstServidores = [];
    this.func.showLoading('Cargando');
    this.generalSvc.apiRest("GET", `servidores`).subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        // console.log("→1←", resp)
        if (resp.status) {
          resp.data.forEach((e:any) => {
            if (e.estado == 1){
              this.lstServidores.push(e);
            }
          });
        } else {
          this.func.handleErrors("Servidor", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
        this.func.handleErrors("Servidor", err);
      },
    });
  }


   getScripts(){
    this.generalSvc.apiRest("GET", "scripts").subscribe({
      next: (resp: any) => {
        if (resp.status) {
          resp.data.forEach((e:any) => {
            if (e.cmds.length > 0){
              let found = false;
              e.cmds.forEach((el:any) => {
                if (!this.validaExclusiones(el.linea_comando)){
                  found = true;
                }
              });
              if (!found){
                e["checked"] = false;
                this.lstScripts.push(e) ;
              }
            }
          });
          // console.log(this.lstScripts)
          this.lstScripts_O = Array.from(this.lstScripts);
        } else {
          this.func.showMessage("error", "Scripts", resp.message);
        }
      },
      error: (err: any) => {
        this.func.handleErrors("Scripts", err);
      },
    });
  }

  getComandos(){
    this.generalSvc.apiRest("GET", "templates").subscribe({
      next: (resp: any) => {
        if (resp.status) {
          resp.data.forEach((e:any) => {
            if (this.validaExclusiones(e.linea_comando)){
              e["checked"] = false;
              this.lstComandos.push(e)  
            }
          });
          // console.log(this.lstComandos)
          this.lstComandos_O = Array.from(this.lstComandos);
        } else {
          this.func.handleErrors("Comandos", resp.message);
        }
      },
      error: (err: any) => {
        this.func.handleErrors("Comandos", err);
      },
    });
  }

  validaExclusiones(texto:string=""){
    let found = true;
    if (texto.indexOf("{usuario}") > -1){
      found = false;
    }
    if (texto.indexOf("{grupo_nombre}") > -1){
      found = false;
    }
    if (texto.indexOf("{usuario_clave}") > -1){
      found = false;
    }
    if (texto.indexOf("{grupo_id}") > -1){
      found = false;
    }
    if (texto.indexOf("{nombre_servidor}") > -1){
      found = false;
    }
    return found;
  }

  
  checkServer(idservidor:any){
    this.lstServidores.forEach((s:any)=>{
      if (s.idservidor == idservidor){
        s.checked = !s.checked;
      }
    })
  }

  checkScript(idscript:any){
    this.lstScripts.forEach((s:any)=>{
      if (s.idscript == idscript){
        s.checked = !s.checked;
      }
    })
  }

  checkComandos(idcomando:any){
    this.lstComandos.forEach((s:any)=>{
      if (s.idtemplate_comando == idcomando){
        s.checked = !s.checked;
      }
    })
  }

  buscarServer(evento:any){

  }

  buscarScripts(evento:any){

  }
  
  buscarComandos(evento:any){

  }


  movimiento(idx:number){
    this.timeline.forEach((e:any) => {
      e.status = false;
    });
    this.timeline[idx].status = true;
  }

  sendLog(texto:any){
    this.lstLogs.push({
      fecha: moment().format("HH:mm:ss"),
      texto: texto,
    })
  }

  ejecutar(){

    this.sendLog("Preparando proceso ...")

    let lstSvr:any = [];
    let lstC:any = [];
    this.lstProgreso = [];

    this.lstServidores.forEach((srv:any)=>{
      if (srv.checked){
        lstSvr.push(srv);
      }
    });

    this.lstScripts.forEach((s:any)=>{
      if (s.checked){
        s.cmds.forEach((cmd:any) => {
          lstC.push(cmd)
        });
      }
    });

    this.lstComandos.forEach((c:any)=>{
      if (c.checked){
        lstC.push(c)
      }
    });

    if (lstSvr.length == 0 || lstC.length == 0){
      this.func.showMessage("info", "Procesos", "Para ejecutar un proceso debe seleccionar al menos servidor y un script o comando")
      return
    }


    lstSvr.forEach((srv:any)=>{
      lstC.forEach((cmd:any)=>{
        this.lstProgreso.push({
          idservidor: srv.idservidor,
          host: srv.host,
          puerto: srv.agente_puerto,
          nombre: srv.nombre, 
          id: cmd.idtemplate_comando,
          comando: cmd.linea_comando.trim(),
          resultado: "",
        })
      });
    });

    this.sendLog("Iniciando proceso ...")


    this.lstProgreso.forEach((srv:any)=>{
      let found  = false;
      this.lstSend.forEach((snd:any)=>{
          if (srv.idservidor == snd.idservidor){
            snd.enviar.data.push({id: srv.id, cmd: srv.comando})
            found = true;
          }
      });

      if (!found){
        this.lstSend.push({
          idservidor: srv.idservidor,
          nombre: srv.nombre, 
          host: srv.host,
          puerto: srv.puerto,
          enviar:{
            action: "comando",
            identificador: {
              idcliente: this.user.idcliente,
              idusuario: this.user.idusuario,
              usuario: this.user.usuario,
              idservidor: srv.idservidor,
              id: Math.floor(Math.random() * (9999999999999999 - 1000000000000000 + 1)) + 1000000000000000,
            },
            data: [{id: srv.id, cmd: srv.comando}]
          }
        });
      }
    });

    this.serverIndex = 0;
    // console.log(this.lstSend)
    this.func.showLoading('Cargando procesos a los servidores seleccionados');
    this.sendMonitor();
  }

  sendMonitor() {
    if (this.serverIndex == this.lstSend.length) {
      this.serverIndex = 0;
      this.revisando = '';
      this.continuar = true;
      this.func.showMessage("info", "Procesos", "Ejecución de procesos a finalizado");
      this.displayExporta = true;
    } else {
      this.continuar = false;
      this.openWS(this.lstSend[this.serverIndex]);
    }
  }

  openWS(server: any) {
    const token = this.sessions.get('token');
    this.sendLog(`Enviando a ${server.nombre}`);

    let url = `ws://${server.host}:${server.puerto}/ws?token=${token}`;
    let accion = false;
    try {
      if (!this.connection.has(server.idservidor)){
        accion = true
      }else{
        if (this.connection_status.get(server.idservidor) == "" || this.connection_status.get(server.idservidor) == "Desconectado"){
          accion = true;
        }
      }
      if (accion){
        this.ws = new WebSocket(url);
        this.connection.set(server.idservidor, this.ws)
        this.connection_status.set(server.idservidor, "");
        
        this.ws.onopen = (event: any) => this.onOpenListener(event, server);
        this.ws.onmessage = (event: any) => this.onMessageListener(event, server);
        this.ws.onclose = (event: any) => this.onCloseListener(event, server);
        this.ws.onerror = (event: any) => this.onErrorListener(event, server);
      }else{
        this.ws = this.connection.get(server.idservidor);
        this.onSendCommand(server);
      }
    } catch (ex) {
      console.log("♫", ex)
    }
  }

  onOpenListener(event: any, server: any) {
    let status = '';
    if (event.type == 'open') {
      console.log(`√ Conectado ${server.nombre}`);
      this.connection_status.set(server.idservidor, "Conectado");
      server.healthy_agente = 'OK|Conectado';
      status = "Conectado";
      this.onSendCommand(server);
    } else {
      console.log(`X Desconectado ${server.nombre}`);
      this.connection_status.set(server.idservidor, "Desconectado");
      server.healthy_agente = 'FAIL|Desconectado';
      status = "Desconectado";
    }
    this.buscaServidor(server, null, server.status);
  }

  onMessageListener(e: any, server: any) {
    console.log(`√ LlegoMensaje ${server.nombre}`);
    let data = JSON.parse(e.data);
    let r = "";
    data.data.forEach((d:any)=>{
      r = atob(d.respuesta);
      r = r.replace(/\n/g, " ");
      this.buscaServidor(server, d.id, r)
    });

    this.serverIndex++;
    this.sendMonitor();
  }

  onCloseListener(event: any, server: any) {
    if (event.code != 1000) {
      this.connection_status.set(server.idservidor, "Desconectado");
      console.log(`X Desconectado ${server.idservidor}`);
      server.healthy_agente = 'FAIL|Desconectado';
      server.check = false;
      this.buscaServidor(server,null,  "Desconectado");
      this.serverIndex++;
      try {
        this.sendMonitor();
      } catch (err) {}
    } else{
      console.log(`X Desconectado manualmente ${server.idservidor}`);
    }
  }

  onErrorListener(event: any, server: any) {}

  onSendCommand(server:any){
    // console.log(server)
    this.ws.send(JSON.stringify(server.enviar));
  }

  buscaServidor(server:any, id:any = null, valor:any){
    this.lstProgreso.forEach((s: any) => {
      if (s.idservidor == server.idservidor) {
        if (id){
          if (s.id == id){
            s.resultado = valor;
          }
        }else{
          s.resultado = valor;
        }
      }
    });
  }


  mirarTexto(item:any){
    this.func.showMessage("", item.comando, item.resultado, 1000);
  }


  exportarPDF() {
    let data: any = this.prepareToExport();
    let params = {
      orientation: 'l',
      titulo: 'Procesos en bloque',
      data: data,
      filename: `lisah_procesos_bloque_${moment().format('YYYYMMDDHHmmss')}.pdf`,
    };
    this.func.exportarPDF(params);
  }

  exportarCSV() {
    let data: any = this.prepareToExport();
    this.func.exportarCSV(
      data,
      `lisah_procesos_bloque_${moment().format('YYYYMMDDHHmmss')}.csv`
    );
  }

  prepareToExport(): Array<any> {
    let arr: any = [];
    let rolmenu: any = [];
    this.lstProgreso.forEach((srv: any) => {
      // console.log(srv)
      try {
        arr.push({
          idservidor: srv.idservidor,
          host: srv.host,
          puerto: srv.puerto,
          nombre: srv.nombre,
          comando: srv.comando,
          resultado: srv.resultado,
        });
      } catch (err) {
        console.log(err, srv);
      }
    });
    return arr;
  }

  




}
