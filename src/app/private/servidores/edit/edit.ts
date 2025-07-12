import { Component, inject } from '@angular/core';
import { Breadcrums } from '../../shared/breadcrums/breadcrums';
import { Header } from '../../shared/header/header';
import { CommonModule } from '@angular/common';
import vForm from './vform';
import { Functions } from '../../../core/helpers/functions.helper';
import { Sessions } from '../../../core/helpers/session.helper';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Global } from '../../../core/config/global.config';
import { ScriptsService } from '../../../core/services/script';
import { ServidorService } from '../../../core/services/servidor';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-edit',
  imports: [Breadcrums, Header, CommonModule, ReactiveFormsModule, FormsModule],
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
  
  user: any = null;
  validador:any = vForm; 
  idservidor: string = "";
  rstData: any;

  nombre: string = "";
  localizacion: string = "";
  host: string = "";
  puerto: string = "";
  idscript_nuevo: string = "";
  estado: number = 1;

  resultadoTest = "";
  lstScripts: Array<any> = [];

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
          this.localizacion = this.rstData.localizacion;
          this.host = this.rstData.host;
          this.puerto = this.rstData.puerto;
          this.idscript_nuevo = this.rstData.idscript_nuevo;
          this.estado = this.rstData.estado;
        } else {
          this.func.showMessage("error", "Usuario", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
      },
    });
  }

  getScripts(){
    this.scriptSvc.getAll().subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.lstScripts = resp.data;
        } else {
          this.func.showMessage("error", "Usuario", resp.message);
        }
      },
      error: (err: any) => {
      },
    });
  }



  funcSubmit(){
    let data = {
      nombre: this.nombre,
      localizacion: this.localizacion,
      host: this.host,
      puerto: this.puerto,
      idscript_nuevo: this.idscript_nuevo,
      estado: this.estado,
    };

    if (this.func.validaCampos(this.validador,data) ){
      return;
    }

    let param = {data};

    this.func.showLoading('Guardando');

    this.srvSvc.save(param, this.idservidor).subscribe({
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
      },
    });

    
  }
  funcCancelar(){
    this.func.goRoute(`admin/servidores`, false, true);
  }


  testSSH(){
    if (this.func.validaCampos(this.validador, {host: this.host}, "host")){
      return ;
    }
    if (this.func.validaCampos(this.validador, {puerto: this.puerto}, "puerto")){
      return;
    }
    let param = {
      data: {
        host: this.host,
        puerto: this.puerto
      }
    }
    this.func.showLoading('Realizando Test');
    this.srvSvc.testHealthy(param).subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        if (resp.status) {
          this.func.showMessage("success", "Servidor", resp.data);
          this.resultadoTest = `<i class="text-success mt-4 ml-2 t12"><i class="fas fa-check-circle  t16"></i> Healthy</i>`;
          this.validador.test.validacion.resultado = "";
        } else {
          this.func.showMessage("error", "Servidor", resp.message);
          this.resultadoTest = `<i class="text-danger mt-4 ml-2 t12"><i class="fas fa-times-circle  t16"></i> No Healthy</i>`;
          this.validador.test.validacion.resultado =  resp.message;
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
      },
    });


  }
}
