import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Sessions } from '../../../core/helpers/session.helper';

@Component({
  selector: 'app-header',
  imports: [ ],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  private readonly sessions = inject(Sessions)

  nombre="";
  icono="";

  ngOnInit(): void {
    let obj = this.sessions.get("ruta");
    if (!obj){
      obj="Dasboards|Dashboard General|fas fa-chart-bar";
    }
    let o = obj.split("|")
    if (o.length==5){
      this.nombre = o[1] + " - " + o[4];
    }else{
      this.nombre = o[1];
    }
    this.icono = o[2];
    
  }
}
