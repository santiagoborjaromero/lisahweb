import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import vForm from './vform';
import { Functions } from '../../../core/helpers/functions.helper';
import { Sessions } from '../../../core/helpers/session.helper';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Global } from '../../../core/config/global.config';
import { ScriptsService } from '../../../core/services/script.service';
import { ServidorService } from '../../../core/services/servidor.service';
import { ActivatedRoute } from '@angular/router';
import { Titulo } from '../../shared/titulo/titulo';
import { Path } from '../../shared/path/path';
import { GeneralService } from '../../../core/services/general.service';


@Component({
  selector: 'app-edit',
  imports: [Titulo, Path, CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './edit.html',
  styleUrl: './edit.scss',
  standalone: true
})
export class Edit {
  private readonly func = inject(Functions);
  private readonly sessions = inject(Sessions);
  private readonly route = inject(ActivatedRoute);
  private readonly srvSvc = inject(ServidorService);
  private readonly scriptSvc = inject(ScriptsService);
  private readonly generalSvc = inject(GeneralService);
  
  user: any = null;
  work: any = null;
  path:any = [];
  titulo:any = {icono: "",nombre:""}
  validador:any = vForm; 
  idservidor: string = "";
  rstData: any;
  global = Global;

  nombre: string = "";
  ubicacion: string = "";
  host: string = "";
  ssh_puerto: string = "";
  agente_puerto: string = "";
  terminal_puerto: string = "";
  idscript_monitoreo: string = "";
  idservidores_familia: string = "";
  comentarios: string = "";
  estado: number = 1;

  resultadoTest = "";
  lstScripts: Array<any> = [];
  lstFamilia: Array<any> = [];

  public canR: boolean = false;
  public canW: boolean = false;
  public canD: boolean = false;

   ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get('user'));

    let uIDUser = this.route.snapshot.paramMap.get('id');

    if (uIDUser && uIDUser != '-1') {
      this.idservidor = uIDUser;
    }else{
      this.idservidor = "";
    }
    
    this.path = [
      {nombre: "Configuración", ruta: ""}, 
      {nombre: "Servidores", ruta: "admin/servidores"}, 
      {nombre: this.idservidor == "" ? "Nuevo" : "Edición", ruta: `admin/servidor/${this.idservidor}`}, 
    ];
  
    this.titulo = {icono: "fas fa-server",nombre: `Servidores - ${this.idservidor == "" ? "Nuevo" : "Edición"}`}

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
    if (this.idservidor != ""){
      setTimeout(() => {
        this.getData();
      }, Global.times[0]);
    }

    this.getScripts();
    this.getFamilia();
  }

  ngOnDestroy(): void {
    this.func.encerarCampos(this.validador);
  }


  getData(){
    this.rstData = null;
    this.func.showLoading('Cargando');
    this.srvSvc.getOne(this.idservidor).subscribe({
      next: (resp: any) => {
        // console.log(resp);
        this.func.closeSwal();
        if (resp.status) {
          this.rstData = resp.data[0];
          this.nombre = this.rstData.nombre;
          this.ubicacion = this.rstData.ubicacion;
          this.host = this.rstData.host;
          this.ssh_puerto = this.rstData.ssh_puerto;
          this.agente_puerto = this.rstData.agente_puerto;
          this.terminal_puerto = this.rstData.terminal_puerto;
          this.comentarios = this.rstData.comentarios;
          this.idservidores_familia = this.rstData.idservidores_familia;
          // this.idscript_monitoreo = this.rstData.idscript_monitoreo;
          this.estado = this.rstData.estado;
        } else {
          this.func.showMessage("error", "Usuario", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
        this.func.handleErrors("Servidores", err);
      },
    });
  }

  getScripts(){
    this.scriptSvc.getAll().subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.lstScripts = resp.data;
        } else {
          this.func.showMessage("error", "Scripts", resp.message);
        }
      },
      error: (err: any) => {
        this.func.handleErrors("Scripts", err);
      },
    });
  }

  getFamilia(){
    this.lstFamilia = [];
    this.generalSvc.apiRest("GET", "servidores_familia").subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.lstFamilia = resp.data;
        } else {
          this.func.showMessage("error", "Familia", resp.message);
        }
      },
      error: (err: any) => {
        this.func.handleErrors("Familia", err);
      },
    });
  }

  funcSubmit(){
    let data = {
      nombre: this.nombre,
      ubicacion: this.ubicacion,
      host: this.host,
      ssh_puerto: this.ssh_puerto,
      agente_puerto: this.agente_puerto,
      terminal_puerto: this.terminal_puerto,
      estado: this.estado,
      comentarios: this.comentarios,
      idservidores_familia: this.idservidores_familia
      // idscript_monitoreo: parseInt(this.idscript_monitoreo),
    };

    if (this.func.validaCampos(this.validador,data) ){
      return;
    }

    let param = {data};

    let method = "POST"
    let url = "servidor"
    if (this.idservidor != "") {
      method = "PUT";
      url += `/${this.idservidor}`
    }

    this.func.showLoading('Guardando');

    // this.srvSvc.save(param, this.idservidor).subscribe({
    this.generalSvc.apiRest(method,  url,  param).subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        if (resp.status) {
          this.funcCancelar();
        } else {
          this.func.showMessage("error", "Servidor", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
        this.func.handleErrors("Servidores", err);
      },
    });

    
  }
  funcCancelar(){
    this.func.goRoute(`admin/servidores`, false, true);
  }


  // testSSH(){
  //   if (this.func.validaCampos(this.validador, {host: this.host}, "host")){
  //     return ;
  //   }
  //   if (this.func.validaCampos(this.validador, {puerto: this.puerto}, "puerto")){
  //     return;
  //   }
  //   let param = {
  //     data: {
  //       host: this.host,
  //       puerto: this.puerto
  //     }
  //   }
  //   this.func.showLoading('Realizando Test');
  //   this.srvSvc.testHealthy(param).subscribe({
  //     next: (resp: any) => {
  //       this.func.closeSwal();
  //       if (resp.status) {
  //         this.func.showMessage("success", "Servidor", resp.data);
  //         this.resultadoTest = `<i role="img" class="text-success mt-4 ml-2 t12"><i role="img" class="fas fa-check-circle  t16"></i> Healthy</i>`;
  //         this.validador.test.validacion.resultado = "";
  //       } else {
  //         this.func.showMessage("error", "Servidor", resp.message);
  //         this.resultadoTest = `<i role="img" class="text-danger mt-4 ml-2 t12"><i role="img" class="fas fa-times-circle  t16"></i> No Healthy</i>`;
  //         this.validador.test.validacion.resultado =  resp.message;
  //       }
  //     },
  //     error: (err: any) => {
  //       this.func.closeSwal();
  //     },
  //   });
  // }
}
