import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-header',
  imports: [ ],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  @Input() title: string = '';
}
