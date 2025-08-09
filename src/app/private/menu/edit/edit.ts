import { Component, inject, Input } from '@angular/core';
import { Menuservice } from '../../../core/services/menuservice.service';
import { Functions } from '../../../core/helpers/functions.helper';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Titulo } from '../../shared/titulo/titulo';
import { Path } from '../../shared/path/path';

@Component({
  selector: 'app-edit',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, Titulo, Path],
  templateUrl: './edit.html',
  styleUrl: './edit.scss',
  standalone: true
})
export class Edit {
  @Input("id") uIDMenu!:string;

  private readonly menuSvc = inject(Menuservice);
  private readonly func = inject(Functions);

  user:any = [];
  path:any = [];
  titulo:any = {icono: "",nombre:""}

  idmenu: string = "";
  rstData: any;

  formData: any = {
    orden: "",
    nombre: "",
    icono: "",
    ruta: "",
    es_submenu: 0,
    estado: false,
  }

  ngOnInit(): void {
    if (this.uIDMenu && this.uIDMenu!='-1') {
      this.idmenu = this.uIDMenu;
      this.getData();
    }else{
      this.idmenu = "";
    }

    this.path = [
      {nombre: "Configuración", ruta: ""}, 
      {nombre: "Grupo de Usuarios", ruta: "admin/grupousuarios"}, 
      {nombre: this.idmenu == "" ? "Nuevo" : "Edición", ruta: `admin/grupousuario/${this.idmenu}`}, 
    ];
  
    this.titulo = {icono: "fas fa-users",nombre: `Grupo de Usuarios - ${this.idmenu == "" ? "Nuevo" : "Edición"}`}
  }

  getData() {
    this.func.showLoading('Cargando');
    this.menuSvc.one(this.idmenu).subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        if (resp.status) {
          this.rstData = resp.data;
        } else {
          this.func.handleErrors("Server", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
      },
    });
  }



}
