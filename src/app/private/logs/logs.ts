import { Component, inject } from '@angular/core';
import { Titulo } from '../shared/titulo/titulo';
import { Path } from '../shared/path/path';
import { Sessions } from '../../core/helpers/session.helper';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logs',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, Titulo, Path],
  templateUrl: './logs.html',
  styleUrl: './logs.scss'
})
export class Logs {
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
