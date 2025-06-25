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
    this.nombre = obj.split("|")[1];
    this.icono = obj.split("|")[2];
    
  }
}
