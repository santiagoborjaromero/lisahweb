import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-breadcrums',
  imports: [],
  templateUrl: './breadcrums.html',
  styleUrl: './breadcrums.scss'
})
export class Breadcrums {
  @Input() lstRutas: Array<any> = [];
}
