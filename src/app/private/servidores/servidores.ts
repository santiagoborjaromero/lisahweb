import { Component } from '@angular/core';
import { Header } from '../shared/header/header';
import { Breadcrums } from '../shared/breadcrums/breadcrums';

@Component({
  selector: 'app-servidores',
  imports: [Header, Breadcrums],
  templateUrl: './servidores.html',
  styleUrl: './servidores.scss'
})
export class Servidores {

}
