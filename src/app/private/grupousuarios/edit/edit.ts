import { Component, inject } from '@angular/core';
import { Header } from '../../shared/header/header';
import { Breadcrums } from '../../shared/breadcrums/breadcrums';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { GrupoUsuarioService } from '../../../core/services/grupousuarios';
import { UsuarioService } from '../../../core/services/usuarios';
import { Functions } from '../../../core/helpers/functions.helper';
import { Sessions } from '../../../core/helpers/session.helper';
import { RolMenuService } from '../../../core/services/rolmenu';

@Component({
  selector: 'app-edit',
  imports: [Header, Breadcrums, FormsModule, CommonModule],
  templateUrl: './edit.html',
  styleUrl: './edit.scss',
  standalone: true
})
export class Edit {

  private readonly route = inject(ActivatedRoute);
  private readonly userSvc = inject(UsuarioService);
  private readonly rolMenuSvc = inject(RolMenuService);
  private readonly grupoSvc = inject(GrupoUsuarioService);
  private readonly func = inject(Functions);
  private readonly sessions = inject(Sessions);

  user: any = null;
  idgrupo_usuario: string = "";
  rstData: any;

  formData: any = {
    nombre: {
      requerido:true,
      valor: "",
      descripcion: "El nombre del grupo puede tener dos funciones operativas en LISAH y en los servidores.",
      validacion:{
        pattern: /^[a-zA-Z0-9._-]+$/,
        patron_descripcion: "Debe ingresar un nombre válido entre mayúsculas, minúsculas, números, guión bajo o medio, punto, no espacios.",
        resultado: "",
      }
    },
    idscript_creacion: {
      requerido:false,
      valor: "",
      descripcion: "Script asignado para ejecutar cuando se crea un grupo de usuarios",
      validacion:{
        pattern: /^[0-9]\/s+$/,
        patron: "",
        resultado: "",
      }
    },
  }

  lstMenu:Array<any> = [];
  selectall: boolean = false;

  lstScripts: Array<any> = [];


  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get('user'));

    let uIDUser = this.route.snapshot.paramMap.get('id');

    if (uIDUser && uIDUser!='-1') {
      this.idgrupo_usuario = uIDUser;
    }else{
      this.idgrupo_usuario = "";
    }
  }

  ngAfterViewInit(): void {
    
    this.getMenuItemsByClient();

    
    if (this.idgrupo_usuario!=""){
      setTimeout(()=>{
        this.getData();
      },800)
    }
  }

  getData() {
    this.func.showLoading('Cargando');

    this.grupoSvc.getOne(this.idgrupo_usuario).subscribe({
      next: (resp: any) => {
        // console.log(resp)
        this.func.closeSwal();
        if (resp.status) {
          this.rstData = resp.data[0];
          this.populateData();
          // this.formData.idgrupo_usuario = this.lstGrupoUsuarios[0].idgrupo_usuario;
        } else {
          this.func.showMessage("error", "Grupo de Usuario", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
      },
    });
  }

  populateData(){
    this.formData.nombre.valor = this.rstData.nombre;
    this.formData.idscript_creacion.valor = this.rstData.idscript_creacion ?? "";

    let found = false;
    let scope:any = [];
    let cont1= 0;
    let cont2= 0;

    this.lstMenu.forEach((m, idx)=>{
      m.check = false;
      scope = [];
      found = false;

      this.rstData.rolmenugrupos.forEach((e:any)=>{
        if (m.idrol_menu == e.idrol_menu){
          scope = e.scope.split("");
          found = true;
        } 
      })
      
      m.r = scope.includes("R");
      m.w = scope.includes("W");
      m.d = scope.includes("D");
      if (found){
        m.check = found;
      }
    })
  }

  getMenuItemsByClient() {
    this.lstMenu = [];

    this.rolMenuSvc.getRolMenuClient().subscribe({
      next: (resp: any) => {
        // console.log(resp)
        this.func.closeSwal();
        if (resp.status) {
          resp.data.forEach((e:any)=>{
            this.lstMenu.push({
              idrol_menu: e.idrol_menu,
              idmenu: e.menu[0].idmenu,
              orden: e.menu[0].orden,
              es_submenu: e.menu[0].es_submenu,
              estado: e.menu[0].estado,
              icono: e.menu[0].icono,
              nombre: e.menu[0].nombre,
              check: false,
              r: false,
              w: false,
              d: false,
            })
          })
          this.lstMenu.sort((a:any, b:any) =>
            a.orden.localeCompare(b.orden)
          );
          
        } else {
          this.func.showMessage("error", "Grupo de Usuario", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
      },
    });
  }

  validacionCampos(que = ''){
    let error = false;
    let danger = 0;
    let warning = 0;

    if (["", "nombre"].includes(que)){
      this.formData.nombre.validacion.resultado = "";
      if (!this.formData.nombre.validacion.pattern.exec(this.formData.nombre.valor)){
        error = true;
        if (this.formData.nombre.requerido){
          danger++;
        }else{
          warning++;
        }
        this.formData.nombre.validacion.resultado = this.formData.nombre.validacion.patron_descripcion;
      }
    }

    return [error, danger, warning]
  }

  funcSubmit(){

    if (this.validacionCampos()[0]){
      return
    }

    let param:any = {
      nombre: this.formData.nombre.valor,
      idscript_creacion: this.formData.idscript_creacion.valor,
      rolmenugrupos: [],
    }

    let count_menu = 0;
    this.lstMenu.forEach(e=>{
      if (e.check){
        let scope = e.r ? "R" : "";
        scope += e.w ? "W" : "";
        scope += e.d ? "D" : "";
        param.rolmenugrupos.push({
          idrol_menu: e.idrol_menu,
          idgrupo_usuario: this.idgrupo_usuario,
          scope: scope
        })
      }
    })

    this.func.showLoading('Guardando');

    this.grupoSvc.save(this.idgrupo_usuario, param).subscribe({
      next: (resp: any) => {
        // console.log(resp)
        this.func.closeSwal();
        if (resp.status) {
          this.rstData = resp.data[0];
          this.funcCancelar();
        } else {
          this.func.showMessage("error", "Grupo de Usuario", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
      },
    });
  }

  funcCancelar(){
    this.func.goRoute(`admin/grupousuarios`, false, true);
  }

  selectAll(){
    this.selectall = !this.selectall;
    this.lstMenu.forEach(e=>{
      e.check = this.selectall;
      e.r = this.selectall;
      e.w = this.selectall;
      e.d = this.selectall;
    });

  }
}
