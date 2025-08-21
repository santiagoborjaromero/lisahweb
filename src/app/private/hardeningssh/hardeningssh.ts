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

ModuleRegistry.registerModules([AllCommunityModule]);


@Component({
  selector: 'app-hardeningssh',
  imports: [Titulo, Path, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './hardeningssh.html',
  styleUrl: './hardeningssh.scss',
  standalone: true,
})
export class Hardeningssh {
  private readonly userSvc = inject(UsuarioService);
  private readonly serverSvc = inject(ServidorService);
  private readonly func = inject(Functions);
  private readonly sessions = inject(Sessions);
  private readonly wsSvc = inject(WSService);

  aqui: any | undefined;

  private server = new Map<number, any>();

  user: any = null;
  path:any = [];
  titulo:any = {icono: "",nombre:""}
  canR: boolean = true;
  canW: boolean = true;
  canD: boolean = true;

  lstServidores: Array<any> = [];
  lstServidores_Original: Array<any> = [];

  buscar:string = "";

  constructor() {
  }


  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get('user'));
    this.path = [
      {nombre: "Admin & Hardening", ruta: ""}, 
      {nombre: "Hardening SSH", ruta: "admin/hardeningssh"}, 
    ];
  
    this.titulo = {icono: "fas fa-terminal",nombre: "Hardening Terminal por SSH"}

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
    this.getUsuario();  
  }
  
  getUsuario() {
    this.lstServidores = [];
    this.func.showLoading('Cargando Servidores del Usuario');

    this.userSvc.getOne(this.user.idusuario).subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        console.log(resp);
        if (resp.status) {
          if (resp.data[0].servidores && resp.data[0].servidores.length > 0) {
            resp.data[0].servidores.forEach((s:any)=>{
              this.lstServidores.push(s)
              this.server.set(s.idservidor, s);
            })
          }

          this.lstServidores_Original = Array.from(this.lstServidores);
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


  gowork(id=""){
    this.lstServidores.forEach((s:any)=>{
      if (s.idservidor == id){
        this.sessions.set("work", JSON.stringify(s));
      }
    });
    this.func.irRuta(`admin/terminalssh`);
  }

  buscarServidores($event:any){
    this.lstServidores = [];
    if (this.buscar == '') {
      this.lstServidores = Array.from(this.lstServidores_Original);
    } else {
      this.lstServidores_Original.forEach((e) => {
        if (
          e.nombre.toLowerCase().indexOf(this.buscar.toLowerCase()) > -1 ||
          e.ubicacion.toLowerCase().indexOf(this.buscar.toLowerCase()) > -1 ||
          e.host.toLowerCase().indexOf(this.buscar.toLowerCase()) > -1 
        ) {
          this.lstServidores.push(e);
        }
      });
    }
  }

}
