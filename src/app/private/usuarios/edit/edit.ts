import { Component, inject, Input } from '@angular/core';
import { Header } from '../../shared/header/header';
import { Breadcrums } from '../../shared/breadcrums/breadcrums';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UsuarioService } from '../../../core/services/usuarios';
import { Functions } from '../../../core/helpers/functions.helper';
import { Sessions } from '../../../core/helpers/session.helper';
import { GrupoUsuarioService } from '../../../core/services/grupousuarios';
import { ClienteService } from '../../../core/services/clientes';
import { ActivatedRoute, Router } from '@angular/router';
import vForm from './vform';
import { ServidorService } from '../../../core/services/servidor';

@Component({
  selector: 'app-edit',
  imports: [Header, Breadcrums, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './edit.html',
  styleUrl: './edit.scss'
})
export class Edit {
  // @Input("id") uIDUser!:string;

  private readonly route = inject(ActivatedRoute);
  private readonly servidoresSvc = inject(ServidorService);
  private readonly clientesSvc = inject(ClienteService);
  private readonly userSvc = inject(UsuarioService);
  private readonly grupoSvc = inject(GrupoUsuarioService);
  private readonly func = inject(Functions);
  private readonly sessions = inject(Sessions);

  user: any = null;
  idusuario: string = "";
  rstData: any;

  idrol =  3;
  idgrupo_usuario = "";
  idcliente = "";
  estado =  1;
  nombre = "";
  usuario = "";
  ntfy_identificador = "";
  email = "";

  validador:any = vForm; 

  lstGrupoUsuarios:Array<any> = [];
  lstClientes:Array<any> = [];
  lstServidores:Array<any> = [];
  selectall: boolean = false;

  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get('user'));

    let uIDUser = this.route.snapshot.paramMap.get('id');

    if (uIDUser && uIDUser != '-1') {
      this.idusuario = uIDUser;
    }else{
      this.idusuario = "";
    }

    this.idrol = this.user.idrol;
    this.idcliente = this.user.idcliente;
  }

  ngAfterViewInit(): void {
     if (this.idusuario != ""){
      this.getData();
    }

    if (this.user.idrol == 1){
      this.getClientes();
    }

    this.getGrupoUsuarios();
    this.getServidores();
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
          this.idrol = this.rstData.idrol;
          this.idgrupo_usuario = this.rstData.idgrupo_usuario;
          this.idcliente = this.rstData.idcliente;
          this.estado = this.rstData.estado;
          this.nombre = this.rstData.nombre;
          this.usuario = this.rstData.usuario;
          this.ntfy_identificador = this.rstData.ntfy_identificador;
          this.email = this.rstData.email;
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

    this.grupoSvc.getAllFromClient(this.idcliente).subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        if (resp.status) {
          this.lstGrupoUsuarios = resp.data;
          this.idgrupo_usuario = this.lstGrupoUsuarios[0].idgrupo_usuario;
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
        console.log(resp)
        this.func.closeSwal();
        if (resp.status) {
          this.lstClientes = resp.data;
          this.idcliente = this.lstClientes[0].idcliente;
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

  getServidores(){
    this.lstServidores = [];

    this.servidoresSvc.getAll().subscribe({
      next: (resp: any) => {
        console.log(resp)
        this.func.closeSwal();
        if (resp.status) {
          this.lstServidores = resp.data;
          this.lstServidores.forEach(e=>{
            e.check = false;
          })
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
    
    if (!this.nombre){
      error = true;
      errMsg = "Debe ingresar el nombre completo del usuario";
    }

    if (!this.usuario){
      error = true;
      errMsg = "Debe ingresar el usuario para login";
    }

    if (!error && !this.email){
      error = true;
      errMsg = "Debe ingresar un correo electrónico";
    }

    if (this.user.idrol != 1 ){
      if (!error && this.idgrupo_usuario == ""){
        error = true;
        errMsg = "Debe seleccionar el grupo de usuario asignado";
      }
    }

    if (error){
      this.func.showMessage("error", "Usuarios Edit", errMsg);
      return
    }

    let param = {
      data: {
        idrol: this.idrol,
        idgrupo_usuario: this.idgrupo_usuario,
        idcliente: this.idcliente,
        estado: this.estado,
        nombre: this.nombre,
        usuario: this.usuario,
        ntfy_identificador: this.ntfy_identificador,
        email: this.email,
      }
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

  selectAll(){
    this.selectall = !this.selectall;
    this.lstServidores.forEach(e=>{
      e.check = this.selectall;
    });

  }


}
