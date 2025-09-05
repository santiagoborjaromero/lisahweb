import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Functions } from '../../core/helpers/functions.helper';
import { Sessions } from '../../core/helpers/session.helper';
import moment from 'moment';
import { DomSanitizer } from '@angular/platform-browser';
import { ScriptsService } from '../../core/services/script.service';
import { AllCommunityModule, createGrid, GridApi, GridOptions, ICellRendererParams, ModuleRegistry } from 'ag-grid-community';
import { Path } from '../shared/path/path';
import { Titulo } from '../shared/titulo/titulo';
import { ActivatedRoute, RouterOutlet } from '@angular/router';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-workspace',
  imports: [Path, Titulo, CommonModule, ReactiveFormsModule, FormsModule, RouterOutlet],
  templateUrl: './workspace.html',
  styleUrl: './workspace.scss',
  standalone: true
})
export class Workspace implements OnInit  {
  private readonly func = inject(Functions);
  private readonly sessions = inject(Sessions);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly scriptSvc = inject(ScriptsService);
  private readonly route = inject(ActivatedRoute);

  path:any = [];
  titulo:any = {};

  tabactive:string = "general";
  cansee: boolean = false;
  user: any = null;
  work: any = null;
  canR: boolean = true;
  canW: boolean = true;
  canD: boolean = true;
  
  public dtOptions: any = {};
  public gridOptions: GridOptions<any> = {};
  public gridApi?: GridApi<any>;
  public id_selected: string = '';
  public is_deleted: any = null;

  wsConn:any;

  rstServidor:any | undefined;
  lstServidor:any | undefined;

  servidorID:any | undefined;

  links:any = [];
  
  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get('user'));
    this.work = JSON.parse(this.sessions.get('work'));

    this.path = [
      {nombre: "Admin & Hardening", ruta: ""}, 
      {nombre: "Administración", ruta: "admin/administracion"}, 
      {nombre: this.work.nombre, ruta: ""}
    ];

    this.titulo = {icono: "fab fa-buffer",nombre: this.work.nombre}

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

    this.links = [
      { id:"dashboard",         active: true,  icon:"far fa-chart-bar",     title: "Dashboard" },
      { id:"servicios",         active: false, icon:"fa fa-cog",            title: "Servicios"},
      { id:"networking",        active: false, icon:"fas fa-network-wired", title: "Redes"},
      { id:"update",            active: false, icon:"fas fa-download",      title: "Actualizaciones"},
      // { id:"store",             active: false, icon:"fa fa-sd-card",        title: "Almacenamiento"},
      { id:"grupousuarios",     active: false, icon:"fa fa-users",          title: "Grupo de Usuarios"},
      { id:"usuarios",          active: false, icon:"fa fa-user",           title: "Usuarios"},
      // { id:"terminal",          active: false, icon:"fas fa-terminal",      title: "Comandos"},
      { id:"procesos",          active: false, icon:"fas fa-terminal",      title: "Procesos"},
    ]

    this.tabactive = this.links[0].id;
    
  }

  go(ruta=""){
    this.func.irRuta(`admin/administracion/workspace/${ruta}`);
  }

  findTab(tab=""){
    this.cansee = true;
    this.links.forEach((e:any) => {
      e.active = false;
      if (e.id == tab){
        e.active = true;
      }
    });
  }
  
  funcBack(){
    this.func.irRuta(`admin/administracion`);
  }


}
