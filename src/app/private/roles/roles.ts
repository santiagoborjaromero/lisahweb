import { Component } from '@angular/core';
import { Header } from '../shared/header/header';
import { Breadcrums } from '../shared/breadcrums/breadcrums';

@Component({
  selector: 'app-roles',
  imports: [Header, Breadcrums],
  templateUrl: './roles.html',
  styleUrl: './roles.scss'
})
export class Roles {

}
