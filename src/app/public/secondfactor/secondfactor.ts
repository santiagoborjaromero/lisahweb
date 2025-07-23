import { Component, inject } from '@angular/core';
import { Sessions } from '../../core/helpers/session.helper';
import { Functions } from '../../core/helpers/functions.helper';
import moment from 'moment';
import { Global } from '../../core/config/global.config';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Auth } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

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
  private readonly authSvc = inject(Auth);
  private readonly notiSvc = inject(NotificationService);

  current_year = moment().format("YYYY");
  costumer = Global.costumer;
  product = Global.product;
  acronym = Global.acronym;

  tiempo_restante: string = "00:00:00"
  timer: any;
  codigo:string = "";
  elapsed: any ;

  ngOnInit(): void {
    this.onTime();
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  funcSubmit(){
    let msgErr = "";
    let error = false;

    if (!error && this.codigo.trim() == ''){
      msgErr = "Debe ingresar el código de verificación";
      error = true;
    }

    if (error){
      this.func.showMessage("error", "Verificación", msgErr);
      return
    }

    this.func.showLoading("Verificando");

    try{
      this.authSvc.verifyCode(this.codigo).subscribe({
        next: (resp:any) => {
          this.func.closeSwal();
          this.codigo= "";
          if (resp.status){
            this.sessions.set("statusLogged", "true")
            this.func.goRoute("admin");
          } else {
            this.func.showMessage("error", "Verificación", resp.message);
            this.sessions.set('statusLogged', 'false');
            if (resp.message == "El código de verificación ha expirado"){
              clearInterval(this.timer);
              this.func.goRoute("login");
            }
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

  funcBack(){
    clearInterval(this.timer);
    this.func.goRoute("login");
  }

  onTime() {
    let totalSeconds = 5 * 60;

    this.timer = setInterval(() => {
      const minutesLeft = Math.floor(totalSeconds / 60);
      const secondsLeft = totalSeconds % 60;

      this.elapsed = `${minutesLeft.toString().padStart(2, '0')}:${secondsLeft
        .toString()
        .padStart(2, '0')}`;

      totalSeconds--;

      if (totalSeconds < 0) {
        clearInterval(this.timer);
        console.log('⏰ Tiempo terminado!');
        this.funcBack();
      }

    }, 1000);
  }


  funcRegenerarCodigo(){
    clearInterval(this.timer)
    this.onTime();

    //regenerarcodigo
    this.func.showLoading("Regenerando Código");

    try{
      this.authSvc.regenerateCode().subscribe({
        next: (resp:any) => {
          this.func.closeSwal();
          if (resp.status){
          } else {
            this.func.showMessage("error", "Verificación", resp.message);
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
