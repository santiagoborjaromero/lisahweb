import { Component } from '@angular/core';
import { Header } from '../shared/header/header';
import { Breadcrums } from '../shared/breadcrums/breadcrums';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-config',
  imports: [Header, Breadcrums, CommonModule],
  templateUrl: './config.html',
  styleUrl: './config.scss'
})
export class Config {

  accionEditar:boolean = false;

  lstEstado: Array<any> = [
    {id: "0", nombre: "Inactivo"},
    {id: "1", nombre: "Activo"},
  ];

  lstMetodos: Array<any> = [
    {id: "email", nombre: "Correo Electrónico"},
    {id: "ntfy", nombre: "NTFY"},
  ];

  lstScriptCreacionUsuarios: Array<any> = [];
  lstScriptCreacionGrupoUsuarios: Array<any> = [];


  ngOnInit(): void {
    
  }


  ngOnDestroy(): void {
    
  }


  funcSubmit(){
    this.accionEditar = !this.accionEditar;
  }
}
