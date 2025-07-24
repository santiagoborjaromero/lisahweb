import { Component, ElementRef, inject, Input } from '@angular/core';
import { Sessions } from '../../../core/helpers/session.helper';
import { Functions } from '../../../core/helpers/functions.helper';

@Component({
  selector: 'app-path',
  imports: [],
  templateUrl: './path.html',
  styleUrl: './path.scss',
  standalone: true
})
export class Path {
  @Input() lstRutas: any | undefined;
  
  private readonly func = inject(Functions);

  go(ruta=""){
    this.func.irRuta(ruta);
  }

}
