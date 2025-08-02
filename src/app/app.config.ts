import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { HttpClientModule, provideHttpClient, withFetch, withInterceptors, HTTP_INTERCEPTORS } from '@angular/common/http';
import { errorInterceptor } from '../app/interceptors/error-interceptor-interceptor'
import { middlewareInterceptor } from '../app/interceptors/middleware-interceptor'


export const appConfig: ApplicationConfig = {
  providers: [
    BrowserModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    HttpClientModule,
    provideAnimations(), 
    provideAnimationsAsync(),
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient( withFetch(), ), provideAnimationsAsync(),
    provideHttpClient(withInterceptors([middlewareInterceptor])),
    // provideHttpClient(withInterceptors([errorInterceptor])),
    // {provide: HTTP_INTERCEPTORS, useClass: Transmission, multi: true}
  ]
};
