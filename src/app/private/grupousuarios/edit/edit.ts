import { Component } from '@angular/core';
import { Header } from '../../shared/header/header';
import { Breadcrums } from '../../shared/breadcrums/breadcrums';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit',
  imports: [Header, Breadcrums, FormsModule, CommonModule],
  templateUrl: './edit.html',
  styleUrl: './edit.scss'
})
export class Edit {

  


  funcSubmit(){}
  funcCancelar(){}
}
