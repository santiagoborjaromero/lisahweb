import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-titulo',
  imports: [],
  templateUrl: './titulo.html',
  styleUrl: './titulo.scss',
  standalone: true
})
export class Titulo {
  @Input() lstHeader: any | undefined;


}
