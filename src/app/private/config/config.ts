import { Component } from '@angular/core';
import { Header } from '../shared/header/header';
import { Breadcrums } from '../shared/breadcrums/breadcrums';

@Component({
  selector: 'app-config',
  imports: [Header, Breadcrums],
  templateUrl: './config.html',
  styleUrl: './config.scss'
})
export class Config {

}
