import { Component, effect, inject, signal } from '@angular/core';
import moment from 'moment';
import {Global} from '../../core/config/global.config';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Sessions } from '../../core/helpers/session.helper';
import { Functions } from '../../core/helpers/functions.helper';


@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  standalone: true
})
export class Login {
  private readonly sessions = inject(Sessions);
  private readonly func = inject(Functions);

  current_year = moment().format("YYYY");
  costumer = Global.costumer;
  product = Global.product;
  acronym = Global.acronym;
  // remember = signal<boolean>(false);
  remember: boolean = false;

  dataForm = {
    usuario: "",
    clave: ""
  };

  constructor(){
    // effect(() => {
    //   console.log(this.initial)
    //   if (this.remember()){
    //     this.sessions.set("remember", JSON.stringify({remember: this.remember(), usuario:this.dataForm.usuario, clave:this.dataForm.clave}))
    //   }else{
    //     if (this.initial){
    //       this.sessions.set("remember",JSON.stringify({remember: this.remember(), usuario:"", clave:""}))
    //     }
    //   }
    // });
  }

  ngOnInit(): void {
    this.dataForm = JSON.parse(this.sessions.get("remember"));
    if (this.dataForm && this.dataForm.usuario != ""){
      this.remember = true
    }
    // console.log(this.dataForm)
  }

  ngOnDestroy(): void {
    this.dataForm =  {
      usuario: "",
      clave: ""
    };
  }

  funcRemember(){
    this.remember = !this.remember
    if (this.remember){
      this.sessions.set("remember", JSON.stringify({usuario:this.dataForm.usuario, clave:this.dataForm.clave}))
    }else{
      this.sessions.set("remember",JSON.stringify({usuario:"", clave:""}))
    }
  }

  funcSubmit(){
    this.func.goRoute("secondfactor")
  }

} 
