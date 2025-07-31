import { Component, inject } from '@angular/core';
import { Titulo } from '../shared/titulo/titulo';
import { Path } from '../shared/path/path';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Sessions } from '../../core/helpers/session.helper';

@Component({
  selector: 'app-generalidades',
  imports: [Titulo, Path, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './generalidades.html',
  styleUrl: './generalidades.scss',
  standalone: true,
})
export class Generalidades {
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