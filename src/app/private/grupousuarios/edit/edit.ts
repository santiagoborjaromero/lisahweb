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
    nombre: "",
    idgrupo: 0,
    rolmenugrupos: []
  }

  patrones = {
    nombre: {pattern: /^[a-zA-Z0-9._-]+$/, mensaje: "A-Z, a-z, 0-9, Guión bajo o medio, punto, no espacios."} 
  }

  lstMenu:Array<any> = [];
  selectall: boolean = false;


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
    this.formData.nombre = this.rstData.nombre;
    this.formData.idgrupo = this.rstData.idgrupo;

    let found = false;
    this.rstData.rolmenugrupos.forEach((e:any)=>{
      let scope:any = e.scope.split("");
      this.lstMenu.forEach(m=>{
        if (m.idrol_menu = e.idrol_menu){
          m.check = true;
          m.r = scope.includes("R");
          m.w = scope.includes("W");
          m.d = scope.includes("D");
        } 
      })
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



  funcSubmit(){
    let errMsg = "";
    let error = false;
    
    if (this.formData.nombre == ""){
      error = true;
      errMsg = "Debe ingresar el nombre del grupo";
    }

    if (!error && !this.patrones.nombre.pattern.exec(this.formData.nombre)){
      error = true;
      errMsg = this.patrones.nombre.mensaje;
    }


    let count_menu = 0;
    this.lstMenu.forEach(e=>{
      if (e.check){
        let scope = e.r ? "R" : "";
        scope += e.w ? "W" : "";
        scope += e.d ? "D" : "";
        this.formData.rolmenugrupos.push({
          idrol_menu: e.idrol_menu,
          idgrupo_usuario: this.idgrupo_usuario,
          scope: scope
        })
      }
    })


    if (error){
      this.func.showMessage("error", "Grupo de Usuarios Edit", errMsg);
      return
    }

    this.func.showLoading('Guardando');

    this.grupoSvc.save(this.idgrupo_usuario, this.formData).subscribe({
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
