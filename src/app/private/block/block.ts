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

  user: any = null;
  path:any = [];
  titulo:any = {icono: "",nombre:""}
  canR: boolean = true;
  canW: boolean = true;
  canD: boolean = true;
  
  lstServidores: Array<any> = [];
  lstServidores_O: Array<any> = [];
  
  displayServidores: boolean = false;
  displayScripts: boolean = false;
  displayComandos: boolean = false;

  oBuscarServer:string = "";
  oBuscarScripts:string = "";
  oBuscarComandos:string = "";
  
  lstScripts_O:any = [];
  lstScripts:any = [];
  lstComandos:any = [];
  lstComandos_O:any = [];
  
  

  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get('user'));
    this.path = [
      {nombre: "Admin & Hardening", ruta: ""}, 
      {nombre: "Terminal en Bloque", ruta: "admin/block"}, 
    ];
  
    this.titulo = {icono: "fas fa-terminal",nombre: "Terminal en Bloque"}

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

    this.getUsuario();
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


   getScripts(){
    this.generalSvc.apiRest("GET", "scripts").subscribe({
      next: (resp: any) => {
        if (resp.status) {
          resp.data.forEach((e:any) => {
            e["checked"] = false;
            this.lstScripts.push(e)  
          });
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
            e["checked"] = false;
            this.lstComandos.push(e)  
          });
          console.log(this.lstComandos)
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
  




}
