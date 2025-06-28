import { Component, inject, Input } from '@angular/core';
import { Header } from '../../shared/header/header';
import { Breadcrums } from '../../shared/breadcrums/breadcrums';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../../core/services/usuarios';
import { Functions } from '../../../core/helpers/functions.helper';
import { Sessions } from '../../../core/helpers/session.helper';
import { GrupoUsuarioService } from '../../../core/services/grupousuarios';
import { ClienteService } from '../../../core/services/clientes';
import { ActivatedRoute, Router } from '@angular/router';


@Component({
  selector: 'app-edit',
  imports: [Header, Breadcrums, CommonModule, FormsModule],
  templateUrl: './edit.html',
  styleUrl: './edit.scss'
})
export class Edit {
  // @Input("id") uIDUser!:string;

  private readonly route = inject(ActivatedRoute);
  private readonly clientesSvc = inject(ClienteService);
  private readonly userSvc = inject(UsuarioService);
  private readonly grupoSvc = inject(GrupoUsuarioService);
  private readonly func = inject(Functions);
  private readonly sessions = inject(Sessions);

  user: any = null;
  idusuario: string = "";
  rstData: any;

  formData: any = {
    idrol: 3,
    idgrupo_usuario: "",
    idcliente: "",
    estado: 1,
    nombre: "",
    usuario: "",
    ntfy_identificador: "",
    email: ""
  }

  lstGrupoUsuarios:Array<any> = [];
  lstClientes:Array<any> = [];

  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get('user'));

    let uIDUser = this.route.snapshot.paramMap.get('id');

    if (uIDUser && uIDUser!='-1') {
      this.idusuario = uIDUser;
      // this.getData();
    }else{
      this.idusuario = "";
    }

  }

  ngAfterViewInit(): void {
    if (this.idusuario!=""){
      this.getData();
    }

    if (this.user.idrol == 1){
      this.getClientes();
      
    } else{
      this.formData.idrol = this.user.idrol;
      this.formData.idcliente = this.user.idcliente;
    }
  }

  getData(){
    this.rstData = null;
    this.func.showLoading('Cargando');

    this.userSvc.getOne(this.idusuario).subscribe({
      next: (resp: any) => {
        // console.log(resp);
        this.func.closeSwal();
        if (resp.status) {
          this.rstData = resp.data[0];
          this.formData.idrol = this.rstData.idrol;
          this.formData.idgrupo_usuario = this.rstData.idgrupo_usuario;
          this.formData.idcliente = this.rstData.idcliente;
          this.formData.estado = this.rstData.estado;
          this.formData.nombre = this.rstData.nombre;
          this.formData.usuario = this.rstData.usuario;
          this.formData.ntfy_identificador = this.rstData.ntfy_identificador;
          this.formData.email = this.rstData.email;
        } else {
          this.func.showMessage("error", "Usuario", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
      },
    });
  }

  getGrupoUsuarios(){
    this.lstGrupoUsuarios = [];

    this.grupoSvc.getAllFromClient(this.formData.idcliente).subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        if (resp.status) {
          this.lstGrupoUsuarios = resp.data;
          this.formData.idgrupo_usuario = this.lstGrupoUsuarios[0].idgrupo_usuario;
        } else {
          this.func.showMessage("error", "Grupo de Usuario", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
      },
    });
  }


  getClientes(){
    this.lstClientes = [];

    this.clientesSvc.getAll().subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        if (resp.status) {
          this.lstClientes = resp.data;
          this.formData.idcliente = this.lstClientes[0].idcliente;
          this.getGrupoUsuarios();
        } else {
          this.func.showMessage("error", "Clientes", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
      },
    });
  }

  funcSubmit(){
    let errMsg = "";
    let error = false;
    
    if (!this.formData.nombre){
      error = true;
      errMsg = "Debe ingresar el nombre del usuario";
    }

    if (!error && !this.formData.email){
      error = true;
      errMsg = "Debe ingresar un correo electrónico";
    }

    if (this.user.idrol != 1 ){
      if (!error && this.formData.idgrupo_usuario == ""){
        error = true;
        errMsg = "Debe seleccionar el grupo de usuario asignado";
      }
    }

    if (error){
      this.func.showMessage("error", "Usuarios Edit", errMsg);
      return
    }

    let param = {
      data: this.formData
    }

    this.func.showLoading('Guardando');

    this.userSvc.save(param, this.idusuario).subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        if (resp.status) {
          this.funcCancelar();
        } else {
          this.func.showMessage("error", "Usuario", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
      },
    });
  }

  funcCancelar(){
    this.func.goRoute(`admin/usuarios`, false, true);
  }


}
