import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Sessions } from '../../core/helpers/session.helper';
import { Path } from '../shared/path/path';
import { Titulo } from '../shared/titulo/titulo';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, Titulo, Path],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  standalone: true
})
export class Dashboard {

  private readonly sessions = inject(Sessions);

  user: any = null;
  path:any = [];
  titulo:any = {icono: "",nombre:""}

  ngOnInit(): void {
    
    this.path = [
      {nombre: "Dashboards", ruta: ""}, 
      {nombre: "Dashboard", ruta: "admin/dashboard"}, 
    ];
  
    this.titulo = {icono: "fas fa-chart-bar",nombre: "Dashboard"}
    
  }
}
