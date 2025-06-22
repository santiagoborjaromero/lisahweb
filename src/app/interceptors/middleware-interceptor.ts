import { HttpInterceptorFn, HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
  HttpHandlerFn, } from '@angular/common/http';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { Encryption } from '../core/helpers/encryption.helper';

export const middlewareInterceptor: HttpInterceptorFn = (request, next: HttpHandlerFn) => {
  const encr =  inject(Encryption);
  return next(request).pipe(
      map((event)=>{
        console.log("▄ Middleware ▄")
        // if (event instanceof HttpResponse){
        //   let message = event.body.message;
        //   let convert = encr.convertRequest(message);
        //   event.body.message = convert;
        // }
        // if (event instanceof HttpRequest){
        //   console.log("REQUEST", event)
        // }
        return event
      })

    );
};
