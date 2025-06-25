import { Component } from '@angular/core';
import { Header } from '../shared/header/header';
import { Breadcrums } from '../shared/breadcrums/breadcrums';

@Component({
  selector: 'app-scripts',
  imports: [Header, Breadcrums],
  templateUrl: './scripts.html',
  styleUrl: './scripts.scss'
})
export class Scripts {

}
