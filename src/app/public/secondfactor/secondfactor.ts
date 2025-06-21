import { Component, inject } from '@angular/core';
import { Sessions } from '../../core/helpers/session.helper';
import { Functions } from '../../core/helpers/functions.helper';
import moment from 'moment';
import { Global } from '../../core/config/global.config';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-secondfactor',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './secondfactor.html',
  styleUrl: './secondfactor.scss',
  standalone: true
})
export class Secondfactor {
  private readonly sessions = inject(Sessions);
  private readonly func = inject(Functions);

  current_year = moment().format("YYYY");
  costumer = Global.costumer;
  product = Global.product;
  acronym = Global.acronym;

  tiempo_restante: string = "00:00:00"

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
    
  }


  funcSubmit(){
    this.sessions.set("statusLogged", "true")
    this.func.goRoute("admin");
  }
  funcBack(){
    this.func.goRoute("login");
  }

}
