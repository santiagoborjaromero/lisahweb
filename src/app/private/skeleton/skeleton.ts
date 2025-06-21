import { Component, inject } from '@angular/core';
import { Functions } from '../../core/helpers/functions.helper';
import { Sessions } from '../../core/helpers/session.helper';
import { CommonModule } from '@angular/common';
import moment from 'moment';
import { Global } from '../../core/config/global.config';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-skeleton',
  imports: [CommonModule, RouterOutlet],
  templateUrl: './skeleton.html',
  styleUrl: './skeleton.scss',
  standalone: true
})
export class Skeleton {
  private readonly func = inject(Functions)
  private readonly sessions = inject(Sessions)

  current_year = moment().format("YYYY");
  costumer = Global.costumer;
  product = Global.product;
  acronym = Global.acronym;

  barra_menu: boolean = true;

  /** Usuario */
  idusuario = 0;
  usuario_nombre: string = "Jaime Santiago Borja Romero"
  lstNotificaciones: Array<any> = [
    {id: 1, label: "Proceso 12 Realizado"},
    {id: 2, label: "Proceso 14 Realizado"},
    {id: 3, label: "Proceso 18 Realizado"},
    {id: 4, label: "Proceso 22 Realizado"},
  ];

ngOnInit(): void {

}

ngOnDestroy(): void {
  
}

closeSession(){
  this.sessions.set("statusLogged", "false")
  this.func.goRoute("login");
}



}
