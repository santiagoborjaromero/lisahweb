import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Sessions } from '../../../core/helpers/session.helper';
import { Functions } from '../../../core/helpers/functions.helper';
import iconsData from '../../../core/data/icons.data';
import { Workspace } from '../workspace';
import { Global } from '../../../core/config/global.config';
import { GeneralService } from '../../../core/services/general.service';
import { Shareddashboard } from '../../shared/shareddashboard/shareddashboard';


@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, Shareddashboard],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  standalone: true
})
export class Dashboard {
  private readonly route = inject(ActivatedRoute);
  private readonly sessions = inject(Sessions);
  private readonly func = inject(Functions);
  private readonly generalSvc = inject(GeneralService);
  private readonly parent = inject(Workspace);

  Title = "Dashboard";
  TAB = "dashboard"

  user:any | undefined;
  work:any | undefined;
  icono = iconsData;
  global = Global;

  rstServidor: any = { usuarios: [] };

  loading:boolean = false;
  playMonitor:boolean = false;

  lstServicios: Array<any> = [];
  lstRecursos: any = {};
  lstDatos:any = [];
  tmrMonitor:any = null;
  tiempo_refresco:number = 0;

  chartLegend:boolean = false;

  dataset1:any = [];

  agente_status:string =  "Desconectado";
  /**
   * Sentinel
   */
  ws: any;
  reconnect: boolean = true;
  light_ws: boolean =false;
  ws_error:number = 0;
  ws_error_limit:number = 3;

  constructor(){
    this.parent.findTab(this.TAB);
    this.work = { usuarios: [] };
  }

  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get("user"));
    this.work = JSON.parse(this.sessions.get("work"));
    this.getServidor();

    console.log(this.work)
  }

  ngOnDestroy(): void {
  }

  getServidor() {
    /**
     * Servidor y lista de usuarios asignados
     */    
    this.func.showLoading('Cargando');
    this.generalSvc.apiRest("GET", `servidores_usuarios/${this.work.idservidor}`).subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        if (resp.status) {
          this.rstServidor = resp.data[0];
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

  go(ruta=""){
    this.parent.tabactive = ruta;
    this.func.irRuta(`admin/administracion/workspace/${ruta}`);
  }

 
}
