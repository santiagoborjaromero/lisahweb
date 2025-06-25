import { Component } from '@angular/core';
import { Header } from '../shared/header/header';
import { Breadcrums } from '../shared/breadcrums/breadcrums';

@Component({
  selector: 'app-procesos',
  imports: [Header, Breadcrums],
  templateUrl: './procesos.html',
  styleUrl: './procesos.scss'
})
export class Procesos {

}
