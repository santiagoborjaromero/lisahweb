import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigService } from '../../core/services/config.service'
import { Functions } from '../../core/helpers/functions.helper';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { verificarRuc } from 'udv-ec';
import { ScriptsService } from '../../core/services/script.service';
import { Global } from '../../core/config/global.config';
import { Titulo } from '../shared/titulo/titulo';
import { Path } from '../shared/path/path';
import { Sessions } from '../../core/helpers/session.helper';
import { GeneralService } from '../../core/services/general.service';

@Component({
  selector: 'app-profile',
  imports: [Titulo, Path, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
  standalone: true
})
export class Profile {
  private readonly func = inject(Functions);
  private readonly sessions = inject(Sessions);
  private readonly generalSvc = inject(GeneralService);

  user: any = null;
  work: any = null;
  path:any = [];
  titulo:any = {icono: "",nombre:""}

  rstConfig: any;
  global = Global;

  edit: boolean = false;

  email: string = "";
  ntfy_identificador: string = "";
  nombre: string = "";

  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get('user'));
    // console.log(this.user)
    this.email = this.user.email;
    this.ntfy_identificador = this.user.ntfy_identificador;
    this.nombre = this.user.nombre;
    this.path = [
      {nombre: "Perfil del Usuario", ruta: ""}, 
    ];
  
    this.titulo = {icono: "fa fa-user",nombre: "Perfil"}
  }

  save(){
    this.edit = false;
    let error = false;
    let msgError = "";

    if (!error && this.email == ""){
      error = true;
      msgError = "Debe ingresar un correo eletronico valido";
    }

    if (this.user.segundo_factor_metodo == "ntfy"){
      if (!error && this.ntfy_identificador == ""){
        error = true;
        msgError = "Debe ingresar un identificador ntfy válido";
      }
    }

    if (!error && this.nombre == ""){
      error = true;
      msgError = "El nombre no puede estar en blanco";
    }

    if (error){
      this.func.showMessage("error", "Perfil", msgError);
      return
    }

    let param = {
      email: this.email,
      ntfy_identificador: this.ntfy_identificador,
      nombre: this.nombre,
      // idrol: this.user.idrol,
      // idgrupo_usuario: this.user.idgrupo_usuario,
      // idcliente: this.user.idcliente,
      // estado: this.user.estado,
      // usuario: this.user.usuario,
    }

    this.generalSvc.apiRest("PUT", `usuario/${this.user.idusuario}`, param).subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        if (resp.status) {
          this.func.toast("info", "Perfil actualizado con éxito")
        } else {
          this.func.showMessage('error', 'Perfil', resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
        this.func.handleErrors("Scripts", err);
      },
    });
  }
}
