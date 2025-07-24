import { Component, effect, inject } from '@angular/core';
import { Breadcrums } from '../shared/breadcrums/breadcrums';
import { Header } from '../shared/header/header';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AllCommunityModule, ColumnAutosizeService, createGrid, GridApi, GridOptions, ICellRendererParams, ModuleRegistry} from 'ag-grid-community';
import { ServidorService } from '../../core/services/servidor.service';
import { Functions } from '../../core/helpers/functions.helper';
import { Sessions } from '../../core/helpers/session.helper';
import { UsuarioService } from '../../core/services/usuarios.service';
import moment from 'moment';

import { WSService } from '../../core/services/ws.service';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-hardening',
  imports: [Breadcrums, Header, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './hardening.html',
  styleUrl: './hardening.scss',
  standalone: true,
})
export class Hardening {
  private readonly userSvc = inject(UsuarioService);
  private readonly serverSvc = inject(ServidorService);
  private readonly func = inject(Functions);
  private readonly sessions = inject(Sessions);
  private readonly wsSvc = inject(WSService);

  aqui: any | undefined;

  // private webSockets = new Map<number, WebSocket>();
  private server = new Map<number, any>();

  user: any = null;
  canR: boolean = true;
  canW: boolean = true;
  canD: boolean = true;

  lstServidores: Array<any> = [];


  constructor() {
    // effect(() => {
    //   console.log("█", this.aqui)
    // });
  }


  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get('user'));
    // console.log(this.user.token)

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

          
        } else {
          this.func.showMessage("error", "Usuario", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
      },
    });
  }

  goServidores(){
     this.func.irRuta(`admin/servidores`);
  }

  goEditServer(id=""){
     this.func.irRuta(`admin/servidor/${id}`);
  }

  gowork(id=""){
    this.lstServidores.forEach((s:any)=>{
      if (s.idservidor == id){
        this.sessions.set("work", JSON.stringify(s));
      }
    });
    this.func.irRuta(`admin/hardening/workspace`);
  }




  
}
