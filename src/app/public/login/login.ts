import { Component, effect, inject, signal } from '@angular/core';
import moment from 'moment';
import {Global} from '../../core/config/global.config';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Sessions } from '../../core/helpers/session.helper';
import { Functions } from '../../core/helpers/functions.helper';
import { environment } from '../../../environments/environment';
import { Auth } from '../../core/services/auth';
import { NotificationService } from '../../core/services/notification-service';


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
  private readonly authSvc = inject(Auth);
  private readonly notiSvc = inject(NotificationService);


  current_year = moment().format("YYYY");
  costumer = Global.costumer;
  product = Global.product;
  acronym = Global.acronym;
  version = Global.appversion;
  entorno = environment.production ? "" : "Desarrollo"
  // remember = signal<boolean>(false);
  remember: boolean = false;

  formData = {
    usuario: "",
    clave: ""
  };

  constructor(){
    // effect(() => {
    //   console.log(this.initial)
    //   if (this.remember()){
    //     this.sessions.set("remember", JSON.stringify({remember: this.remember(), usuario:this.formData.usuario, clave:this.formData.clave}))
    //   }else{
    //     if (this.initial){
    //       this.sessions.set("remember",JSON.stringify({remember: this.remember(), usuario:"", clave:""}))
    //     }
    //   }
    // });
  }

  ngOnInit(): void {
    this.sessions.set('statusLogged', 'false');
    this.sessions.set('user',"");
    this.sessions.set('token',"");
    this.sessions.set('form',"");


    // this.formData = JSON.parse(this.sessions.get("remember"));
    // if (this.formData && this.formData.usuario != ""){
    //   this.remember = true
    // }
  }

  ngOnDestroy(): void {
    this.formData =  {
      usuario: "",
      clave: ""
    };
  }

  // funcRemember(){
  //   this.remember = !this.remember
  //   if (this.remember){
  //     this.sessions.set("remember", JSON.stringify({usuario:this.formData.usuario, clave:this.formData.clave}))
  //   }else{
  //     this.sessions.set("remember",JSON.stringify({usuario:"", clave:""}))
  //   }
  // }

  funcSubmit(){
    let msgErr = "";
    let error = false;

    if (!error && this.formData.usuario.trim() == ''){
      msgErr = "Debe ingresar el nombre del usuario";
      error = true;
    }

    if (!error && this.formData.clave.trim() == ''){
      msgErr = "Debe ingresar la contrasena del usuario";
      error = true;
    }

    if (error){
      this.func.showMessage("error", "Autorización", msgErr);
      return
    }

    this.func.showLoading("Cargando");
    try{
      this.authSvc.login(this.formData).subscribe({
        next: (resp:any) => {
          this.func.closeSwal();
          this.formData.usuario = "";
          this.formData.clave = "";
          if (resp.status){
            let data = resp.data[0];

            if (data){
              this.sessions.set("user", JSON.stringify(data));
              // this.sessions.set('statusLogged', 'false');
              this.sessions.set('token', data.token);
              this.sessions.set('form', JSON.stringify(this.formData));

              if (data.config && data.config.segundo_factor_activo == 1){
                this.func.goRoute("secondfactor")
              }else{
                this.sessions.set("statusLogged", "true")
                this.func.goRoute("admin");
              }

            } else {
              this.func.showMessage("error", "Login", "El usuario no se encuentra activo.");
              this.sessions.set('statusLogged', 'false');
            }
            
          } else {
            this.func.showMessage("error", "Login", resp.message);
            this.sessions.set('statusLogged', 'false');
          }
        },
        error: (err:any) => {
          this.func.closeSwal();
          this.sessions.set('statusLogged', 'false');
          this.notiSvc.showError(err);
        }
    })

    }catch(err){
      // console.log("█", err)
    }
    
  }









} 
