import { Component, inject } from '@angular/core';
import { Titulo } from '../shared/titulo/titulo';
import { Path } from '../shared/path/path';
import { Sessions } from '../../core/helpers/session.helper';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-clientes',
  imports:  [CommonModule, FormsModule, ReactiveFormsModule, Titulo, Path],
  templateUrl: './clientes.html',
  styleUrl: './clientes.scss'
})
export class Clientes {
  private readonly sessions = inject(Sessions);

  user:any = [];
  path:any = [];
  titulo:any = {icono: "",nombre:""}

  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get('user'));
    this.path = [
      {nombre: "Admin & Hardening", ruta: ""}, 
      {nombre: "Auditoria Logs", ruta: "admin/logs"}, 
    ];
    this.titulo = {icono: "fas fa-traffic-light",nombre: "Auditoria Logs"}
  }
}
