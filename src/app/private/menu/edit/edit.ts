import { Component, inject, Input } from '@angular/core';
import { Menuservice } from '../../../core/services/menuservice';
import { Functions } from '../../../core/helpers/functions.helper';
import { Header } from '../../shared/header/header';
import { Breadcrums } from '../../shared/breadcrums/breadcrums';

@Component({
  selector: 'app-edit',
  imports: [Header, Breadcrums],
  templateUrl: './edit.html',
  styleUrl: './edit.scss',
  standalone: true
})
export class Edit {
  @Input("id") uIDMenu!:string;

  private readonly menuSvc = inject(Menuservice);
  private readonly func = inject(Functions);

  title = 'Menu de Opciones';
  rutas: Array<any> = ['Creadores', 'Menú de Opciones', "Edicion"];

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
  }

  getData() {
    this.func.showLoading('Cargando');
    this.menuSvc.one(this.idmenu).subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        if (resp.status) {
          this.rstData = resp.data;
        } else {
          this.func;
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
      },
    });
  }



}
