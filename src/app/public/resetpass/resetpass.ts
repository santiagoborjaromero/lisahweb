import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-resetpass',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './resetpass.html',
  styleUrl: './resetpass.scss',
  standalone: true
})
export class Resetpass {

}
