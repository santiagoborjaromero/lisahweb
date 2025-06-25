import { Component } from '@angular/core';
import { Header } from '../shared/header/header';
import { Breadcrums } from '../shared/breadcrums/breadcrums';

@Component({
  selector: 'app-variables',
  imports: [Header,Breadcrums],
  templateUrl: './variables.html',
  styleUrl: './variables.scss'
})
export class Variables {

}
