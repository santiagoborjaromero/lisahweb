import { inject, Injectable } from '@angular/core';
import { Functions } from '../helpers/functions.helper';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  func = inject(Functions)
  constructor() { }

  showError(err: any, duration: number = 5000) {
    let message = "";
    if (!environment.production) console.log(err)
    if (err.status === 0) {
      message = 'No se puede conectar con el servidor. ¿La API está corriendo?';
    } else {
      message = `Error ${err.status}: ${err.message}`;
    }
    this.func.showMessage("error", "Error", message);
  }
}
