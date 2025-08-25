import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Sessions } from '../../core/helpers/session.helper';
import { Path } from '../shared/path/path';
import { Titulo } from '../shared/titulo/titulo';
import { Functions } from '../../core/helpers/functions.helper';
import { GeneralService } from '../../core/services/general.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, Titulo, Path],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  standalone: true
})
export class Dashboard {

  private readonly sessions = inject(Sessions);
  private readonly func = inject(Functions);
  private readonly generalSvc = inject(GeneralService);


  user: any = null;
  path:any = [];
  titulo:any = {icono: "",nombre:""}

  lstUsuarios: Array<any> = [];
  lstServidores: Array<any> = [];

  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get('user'));
    this.path = [
      {nombre: "Dashboards", ruta: ""}, 
      {nombre: "Dashboard", ruta: "admin/dashboard"}, 
    ];
    this.titulo = {icono: "fas fa-chart-bar",nombre: "Dashboard"}
    
    this.getServidores();
  }


  getServidores() {
    this.lstServidores = [];
    this.func.showLoading('Cargando');

    this.generalSvc.apiRest("GET", "servidores").subscribe({
      next: (resp: any) => {
        // console.log(resp);
        this.func.closeSwal();
        if (resp.status) {
          this.lstServidores = resp.data;
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

  getDataUsuarios() {
    this.lstUsuarios = [];
    this.func.showLoading('Cargando');

    // this.generalSvc.apiRest("GET", `servidores_usuarios/${this.work.idservidor}`).subscribe({
    //   next: (resp: any) => {
    //     this.func.closeSwal();
    //     if (resp.status) {
    //       if (resp.data[0].usuarios.length > 0){
    //         resp.data[0].usuarios.forEach((e:any)=>{
    //           e["servidor"] = null;
    //           this.lstUsuarios.push(e)
    //         })
    //       }
    //       if (resp.data[0].comandos.length > 0){
    //         this.lstComandos = resp.data[0].comandos;
    //       }
    //       // this.ejecutaOperaciones("ver_actualizaciones");
    //       this.startMonitor();
    //     } else {
    //       this.func.handleErrors("Server", resp.message);
    //     }
    //   },
    //   error: (err: any) => {
    //     this.func.closeSwal();
    //     this.func.handleErrors("Actualizaciones", err);
    //   },
    // });
  }


  
}
