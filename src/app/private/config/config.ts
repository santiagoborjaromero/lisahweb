import { Component, inject } from '@angular/core';
import { Header } from '../shared/header/header';
import { Breadcrums } from '../shared/breadcrums/breadcrums';
import { CommonModule } from '@angular/common';
import { ConfigService } from '../../core/services/config'
import { Functions } from '../../core/helpers/functions.helper';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { verificarRuc } from 'udv-ec';

@Component({
  selector: 'app-config',
  imports: [Header, Breadcrums, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './config.html',
  styleUrl: './config.scss'
})
export class Config {
  private readonly configSvc = inject(ConfigService);
  private readonly func = inject(Functions);

  rstConfig: any;

  accionEditar:boolean = false;

  lstEstado: Array<any> = [
    {id: "0", nombre: "Inactivo"},
    {id: "1", nombre: "Activo"},
  ];

  lstMetodos: Array<any> = [
    {id: "email", nombre: "Correo Electrónico"},
    {id: "ntfy", nombre: "NTFY"},
  ];

  lstScriptCreacionUsuarios: Array<any> = [];
  lstScriptCreacionGrupoUsuarios: Array<any> = [];

  idconfiguracion: number = 0;
  idcliente: number = 0;
  cliente_nombre: string = "";
  cliente_identificacion: string = "";
  cliente_direccion: string = "";
  cliente_telefono: string = "";
  ldap_servidor: string = "";
  ldap_puerto: string = "";
  ldap_usuario: string = "";
  ldap_clave: string = "";
  ldap_base_dn: string = "";
  segundo_factor_activo: boolean = false;
  segundo_factor_metodo: string = "";
  idscript_creacion_grupo_usuarios: number = 0;
  idscript_creacion_usuario: number = 0;
  tiempo_refresco: number = 0;
  tiempo_caducidad_claves: number = 0;
  tiempo_caducidad_token_usuarios: number = 0;
  tiempo_caducidad_token_agente: number = 0;
  
  validaNombre: string = "";
  validaRUC: string = "";

  ngOnInit(): void {
    setTimeout(()=>{
      this.getData();
    },800)
  }

  ngOnDestroy(): void {
  }

  getData(load = false){
    if (!load) this.func.showLoading("Cargando");

    this.accionEditar = false;

    this.configSvc.getAll().subscribe({
      next: (resp) => {
        this.func.closeSwal();
        // console.log(resp)
        if (resp.status){
          this.rstConfig = resp.data[0];
          this.populateData();
        }else{
          this.func.showMessage("error", "Configuración", resp.message)
        }
      },
      error: (err) => {
        this.func.closeSwal();
        console.log(err)
      }
    })
  }

  populateData(){
    this.idconfiguracion = this.rstConfig.idconfiguracion;
    this.idcliente = this.rstConfig.idcliente;
    this.cliente_nombre = this.rstConfig.cliente.nombre;
    this.cliente_identificacion = this.rstConfig.cliente.identificacion;
    this.cliente_direccion = this.rstConfig.cliente.direccion;
    this.cliente_telefono = this.rstConfig.cliente.telefono;
    this.ldap_servidor = this.rstConfig.ldap_servidor;
    this.ldap_puerto = this.rstConfig.ldap_puerto;
    this.ldap_usuario = this.rstConfig.ldap_usuario;
    this.ldap_clave = this.rstConfig.ldap_clave;
    this.ldap_base_dn = this.rstConfig.ldap_base_dn;
    this.segundo_factor_activo = this.rstConfig.segundo_factor_activo;
    this.segundo_factor_metodo = this.rstConfig.segundo_factor_metodo;
    this.idscript_creacion_grupo_usuarios = this.rstConfig.idscript_creacion_grupo_usuarios;
    this.idscript_creacion_usuario = this.rstConfig.idscript_creacion_usuario;
    this.tiempo_refresco = this.rstConfig.tiempo_refresco;
    this.tiempo_caducidad_claves = this.rstConfig.tiempo_caducidad_claves;
    this.tiempo_caducidad_token_usuarios = this.rstConfig.tiempo_caducidad_token_usuarios;
    this.tiempo_caducidad_token_agente = this.rstConfig.tiempo_caducidad_token_agente;
  }

  funcCancelar(){
    this.accionEditar = !this.accionEditar;
    this.populateData();
  }

  validacionCampos(que = ''){
    let error = false;
    let errMsg = "";

    if (["", "nombre"].includes(que)){
      this.validaNombre = "";
      if (this.cliente_nombre.trim() == ""){
        error = true;
        errMsg = "Debe ingresar la Razon Social";
        this.validaNombre = errMsg;
      }
    }

    if (["", "ruc"].includes(que)){
      this.validaRUC = "";
      if(!verificarRuc(this.cliente_identificacion.toString())){
        errMsg = "Debe ingresar una identificacion valida";
        this.validaRUC = errMsg;
        if (!error) error = true;
      }
    }


    return error

  }

  funcSubmit(){
    // let errMsg = "";
    // let error = false;
    
    // if (this.cliente_nombre == ""){
    //   error = true;
    //   errMsg = "Debe ingresar la Razon Social";
    // }

    // if (!error && this.cliente_identificacion == ""){
    //   error = true;
    //   errMsg = "Debe ingresar la identificacion";
    // }

    // if (!error && !verificarRuc(this.cliente_identificacion)){
    //   error = true;
    //   errMsg = "Debe ingresar una identificacion valida";
    // }

    // if (error){
    //   this.func.showMessage("error", "Configuración", errMsg);
    //   return
    // }

    if (this.validacionCampos()){
      return
    }



    this.accionEditar = !this.accionEditar;
    
    let record = {
      idconfiguracion: this.idconfiguracion,
      idcliente: this.idcliente,
      cliente_nombre: this.cliente_nombre,
      cliente_identificacion: this.cliente_identificacion,
      cliente_direccion: this.cliente_direccion,
      cliente_telefono: this.cliente_telefono,
      ldap_servidor: this.ldap_servidor,
      ldap_puerto: this.ldap_puerto,
      ldap_usuario: this.ldap_usuario,
      ldap_clave: this.ldap_clave,
      ldap_base_dn: this.ldap_base_dn,
      segundo_factor_activo: this.segundo_factor_activo,
      segundo_factor_metodo: this.segundo_factor_metodo,
      idscript_creacion_grupo_usuarios: this.idscript_creacion_grupo_usuarios,
      idscript_creacion_usuario: this.idscript_creacion_usuario,
      tiempo_refresco: this.tiempo_refresco,
      tiempo_caducidad_claves: this.tiempo_caducidad_claves,
      tiempo_caducidad_token_usuarios: this.tiempo_caducidad_token_usuarios,
      tiempo_caducidad_token_agente: this.tiempo_caducidad_token_agente,
    }


    this.configSvc.save(record).subscribe({
        next: (resp:any) => {
          // console.log(resp)
          if (resp.status){
            this.func.showMessage("info", "Configuración", "Se ha guardado con éxito");
            setTimeout(()=>{
              this.getData();
            },1000)
          } else {
            this.func.showMessage("error", "Configuración", resp.message);
          }
        },
        error: (err:any) => {
          this.func.closeSwal();
          this.func.showMessage("error", "Configuración", err);
        }
    })


  }
}
