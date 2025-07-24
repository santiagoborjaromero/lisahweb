import { Component, inject, Sanitizer } from '@angular/core';
import { Breadcrums } from '../shared/breadcrums/breadcrums';
import { Header } from '../shared/header/header';
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
import { General } from "./general/general";
import { Servicios } from './servicios/servicios';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-workspace',
  imports: [Path, Titulo, CommonModule, ReactiveFormsModule, FormsModule, General, General, Servicios, RouterOutlet],
  templateUrl: './workspace.html',
  styleUrl: './workspace.scss',
  standalone: true
})
export class Workspace {
  private readonly func = inject(Functions);
  private readonly sessions = inject(Sessions);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly scriptSvc = inject(ScriptsService);
  private readonly route = inject(ActivatedRoute);

  path:any = [];
  titulo:any = {icono: "fas fa-server",nombre:""}

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
  
  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get('user'));
    this.work = JSON.parse(this.sessions.get('work'));

    this.path = [
      {nombre: "Admin & Hardening", ruta: ""}, 
      {nombre: "Hardening", ruta: "admin/hardening"}, 
      {nombre: this.work.nombre, ruta: ""}
    ];

    this.titulo = {icono: "fas fa-server",nombre: this.work.nombre}

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
  }

  go(ruta=""){
    this.func.irRuta(`admin/hardening/workspace/${ruta}`);
  }
  
  funcBack(){
    this.func.irRuta(`admin/hardening`);
  }


}
