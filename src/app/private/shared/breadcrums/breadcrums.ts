import { Component, inject, Input } from '@angular/core';
import { Sessions } from '../../../core/helpers/session.helper';
import { Functions } from '../../../core/helpers/functions.helper';

@Component({
  selector: 'app-breadcrums',
  imports: [],
  templateUrl: './breadcrums.html',
  styleUrl: './breadcrums.scss'
})
export class Breadcrums {
  // @Input() lstRutas: Array<any> = [];
  private readonly sessions = inject(Sessions)
  private readonly func = inject(Functions)

  lstRutas: any = [];
  icono="";
  oruta = "";

  ngOnInit(): void {
    this.oruta = this.sessions.get("ruta");
    if (!this.oruta){
      this.oruta="Dashboards|Dashboard General|fas fa-chart-bar";
    }
     let o = this.oruta.split("|")
    if (o.length==5){
      this.lstRutas.push({ nombre: o[0], ruta: ""});
      this.lstRutas.push({ nombre: o[1], ruta: o[3]});
      this.lstRutas.push({ nombre: o[4], ruta: ""});
    }else{
      this.lstRutas.push({ nombre: o[0], ruta: ""});
      this.lstRutas.push({ nombre: o[1], ruta: o[3]});
    }
  }

  go(ruta=""){
    this.func.goRoute(`admin/${ruta}`, false, true);
  }


}
