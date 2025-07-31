import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Titulo } from '../shared/titulo/titulo';
import { Path } from '../shared/path/path';
import { Sessions } from '../../core/helpers/session.helper';

@Component({
  selector: 'app-audit',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, Titulo, Path],
  templateUrl: './audit.html',
  styleUrl: './audit.scss',
  standalone: true
})
export class Audit {
  private readonly sessions = inject(Sessions);

  user:any = [];
  path:any = [];
  titulo:any = {icono: "",nombre:""}

  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get('user'));
    this.path = [
      {nombre: "Admin & Hardening", ruta: ""}, 
      {nombre: "Auditoría Usuarios", ruta: "admin/audits"}, 
    ];
    this.titulo = {icono: "fas fa-user-secret",nombre: "Auditoría Usuarios"}
  }
}
