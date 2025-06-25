import { Component } from '@angular/core';
import { Header } from '../shared/header/header';
import { Breadcrums } from '../shared/breadcrums/breadcrums';

@Component({
  selector: 'app-logs',
  imports: [Header, Breadcrums],
  templateUrl: './logs.html',
  styleUrl: './logs.scss'
})
export class Logs {

}
