import { Component } from '@angular/core';
import { Breadcrums } from '../shared/breadcrums/breadcrums';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Header } from '../shared/header/header';

@Component({
  selector: 'app-audit',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, Header, Breadcrums],
  templateUrl: './audit.html',
  styleUrl: './audit.scss',
  standalone: true
})
export class Audit {
}
