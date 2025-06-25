import { Component } from '@angular/core';
import { Header } from '../shared/header/header';
import { Breadcrums } from '../shared/breadcrums/breadcrums';

@Component({
  selector: 'app-templates',
  imports: [Header, Breadcrums],
  templateUrl: './templates.html',
  styleUrl: './templates.scss'
})
export class Templates {

}
