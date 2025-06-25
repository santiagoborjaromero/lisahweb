import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Header } from '../shared/header/header';
import { Breadcrums } from '../shared/breadcrums/breadcrums';

@Component({
  selector: 'app-clientes',
  imports: [CommonModule, FormsModule, Header, Breadcrums],
  templateUrl: './clientes.html',
  styleUrl: './clientes.scss'
})
export class Clientes {

}
