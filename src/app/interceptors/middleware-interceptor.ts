import { HttpInterceptorFn, HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
  HttpHandlerFn, } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Encryption } from '../core/helpers/encryption.helper';
import { environment } from '../../environments/environment';

export const middlewareInterceptor: HttpInterceptorFn = (request:any, next: HttpHandlerFn) => {
  const encr =  inject(Encryption);
  return next(request).pipe(
      map((event:any)=>{
        if (event instanceof HttpResponse){
          if (environment.debug) console.log(JSON.stringify(event.body));
          event.body.message =  encr.decrypt(event.body.message);
          event.body.data = JSON.parse(encr.decrypt(event.body.data));
        }
        return event
      })

    );
};
