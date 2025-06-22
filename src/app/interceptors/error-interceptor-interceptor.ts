import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { tap, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NotificationService } from '../core/services/notification-service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notiSvc = inject(NotificationService)

  return next(req).pipe(
    catchError((err) => {
      // let message = "";
      // console.log("INTER: ", err)
      // if (err.status === 0) {
      //   message = '❌ No se puede conectar con el servidor. ¿La API está corriendo?';
      // } else {
      //   message = `❌ Error ${err.status}: ${err.message}`;
      // }
      // notiSvc.showError(message);
      
      // notiSvc.showError(err);
      return throwError(() => err);
    })
  );
};