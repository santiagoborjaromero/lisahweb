import { Injectable, inject } from '@angular/core';
import { Encryption } from './encryption.helper';
import { Sessions } from '../helpers/session.helper';
import * as moment from 'moment';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { Auth } from '../services/auth';

@Injectable({
  providedIn: 'root',
})
export class Functions {
  private readonly authSvc = inject(Auth);
  private readonly sessions = inject(Sessions);
  private readonly router = inject(Router);

  public toFloat(value: string): number {
    return parseFloat(value);
  }

  nombreMes(nmes: number) {
    let nommes = '';
    switch (nmes) {
      case 1:
        nommes = 'Enero';
        break;
      case 2:
        nommes = 'Febrero';
        break;
      case 3:
        nommes = 'Marzo';
        break;
      case 4:
        nommes = 'Abril';
        break;
      case 5:
        nommes = 'Mayo';
        break;
      case 6:
        nommes = 'Junio';
        break;
      case 7:
        nommes = 'Julio';
        break;
      case 8:
        nommes = 'Agosto';
        break;
      case 9:
        nommes = 'Septiembre';
        break;
      case 10:
        nommes = 'Octubre';
        break;
      case 11:
        nommes = 'Noviembre';
        break;
      case 12:
        nommes = 'Diciembre';
        break;
    }
    return nommes;
  }

  numberFormat(n: number, dec = 2) {
    return n.toLocaleString('en-US', {
      maximumFractionDigits: dec,
      minimumFractionDigits: dec,
    });
  }

  truncate(num: any): number {
    let transf = num.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];
    return parseFloat(transf);
  }

  round(num: any, dec: any) {
    return parseFloat(num.toFixed(dec));
  }

  handleErrors = (title: string = '', error: any = null) => {
    let e = JSON.stringify(error).toLowerCase();
    let msgError = e;
    let match = false;

    if (!match) {
      if (error.hasOwnProperty('message')) {
        msgError = error.message;
        match = true;
      }
    }

    if (!match) {
      if (error.hasOwnProperty('detail')) {
        msgError = error.detail.toLowerCase();
        match = true;
      }
    }

    // console.log(msgError)

    let errs = [
      {
        message: 'http failure response',
        messageResult:
          '<strong>Unable to connect the server !!!</strong><br>Http failure response',
        action: '',
      },
      {
        message: 'unknown error',
        messageResult:
          '<strong>Unable to connect the server !!!</strong><br>Unknown error',
        action: '',
      },
      {
        message: 'httperrorresponse',
        messageResult:
          '<strong>Unable to connect the server !!!</strong><br>HttpErrorResponse',
        action: '',
      },
      {
        message: 'token expired',
        messageResult: 'Token de seguridad expiró',
        action: 'this.auth()',
      },
    ];

    let action = '';
    for (let er of errs) {
      if (msgError.indexOf(er.message) > -1) {
        msgError = er.messageResult;
        if (er.action != '') {
          action = er.action;
        }
      }
    }

    console.log('Error', e);
    // console.log(msgError, action)
    if (action == '') {
      this.showMessage('error', title, msgError);
    } else {
      this.showLoading(msgError);
      console.log(msgError, action);
      // eval(action);
      if (action == 'this.auth()') {
        this.auth();
      }
    }
  };

  auth() {
    let data = JSON.parse(this.sessions.get('form'));
    this.authSvc.login(data).subscribe({
      next: (resp: any) => {
        if (Swal.isVisible()) Swal.close();
        if (resp.status == 'ok') {
          if (resp.message.status) {
            this.sessions.set('user', JSON.stringify(resp.message));
            this.sessions.set('statusLogged', 'true');
            this.sessions.set('token', resp.message.token);
            this.sessions.set('form', JSON.stringify(data));
            this.router.navigate(['/home']);
          } else {
            this.handleErrors(
              'Validacion',
              'El usuario no se encuentra activo'
            );
            this.sessions.set('statusLogged', 'false');
          }
        } else {
          this.handleErrors('Validacion', resp.message);
          this.sessions.set('statusLogged', 'false');
        }
      },
      error: (err: any) => {
        if (Swal.isVisible()) Swal.close();
        this.handleErrors('Validacion', err);
        this.sessions.set('statusLogged', 'false');
      },
    });
  }

  showMessage(type: any, title: any, msg: any) {
    let that = this;
    Swal.fire({
      allowOutsideClick: false,
      allowEscapeKey: false,
      title: title,
      html: msg,
      icon: type,
      footer: environment.appName,
      showClass: { backdrop: 'swal2-noanimation', popup: '' },
      hideClass: { popup: '' },
    });
  }

  closeSwal() {
    if (Swal.isVisible()) Swal.close();
  }

  showLoading(text = '', time = 0) {
    let timerInterval: any;
    Swal.fire({
      allowOutsideClick: false,
      allowEscapeKey: false,
      title: text,
      text: 'Espere un momento',
      timer: time > 0 ? time * 1000 : 0,
      timerProgressBar: true,
      footer: environment.appName,
      showClass: { backdrop: 'swal2-noanimation', popup: '' },
      hideClass: { popup: '' },
      didOpen: () => {
        Swal.showLoading();
        if (time > 0) {
          timerInterval = setInterval(() => {
            const content = Swal.getHtmlContainer();
            if (content) {
              const b: any = content.querySelector('b');
              if (b) {
                b.textContent = Swal.getTimerLeft();
              }
            }
          }, 100);
        }
      },
      willClose: () => {
        clearInterval(timerInterval);
      },
    }).then((result: any) => {
      /* Read more about handling dismissals below */
      if (result.dismiss === Swal.DismissReason.timer) {
        //console.log('I was closed by the timer');
      }
    });
  }

  async goRoute(ruta: string = '') {
    this.router.navigate([`/${ruta}`], {
      replaceUrl: true,
      skipLocationChange: false,
    });
    // this.navCtrl.navigateForward(ruta);
  }
}
