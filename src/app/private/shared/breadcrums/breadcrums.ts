import { Component, inject, Input } from '@angular/core';
import { Sessions } from '../../../core/helpers/session.helper';

@Component({
  selector: 'app-breadcrums',
  imports: [],
  templateUrl: './breadcrums.html',
  styleUrl: './breadcrums.scss'
})
export class Breadcrums {
  // @Input() lstRutas: Array<any> = [];
  private readonly sessions = inject(Sessions)

  lstRutas: any = [];
  icono="";

  ngOnInit(): void {
    let obj = this.sessions.get("ruta");
    if (!obj){
      obj="Dashboards|Dashboard General|fas fa-chart-bar";
    }
    this.lstRutas.push(obj.split("|")[0]);
    this.lstRutas.push(obj.split("|")[1]);
  }


}
