import { EnvironmentInjector, inject, Injectable } from '@angular/core';
import { Encryption } from '../helpers/encryption.helper';
import { Router } from '@angular/router';
import { Address } from '../helpers/address.helper';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { Headers } from '../helpers/headers.helper';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  public base_url: string;
  public headers: any;
  public token: any;

  private readonly http = inject(HttpClient);
  private readonly injector = inject(EnvironmentInjector);
  private readonly encrpt = inject(Encryption);
  private readonly encrouterrpt = inject(Router);
  private readonly headerHlp = inject(Headers);
  private readonly addr = inject(Address);

  constructor() {
    this.base_url = this.addr.getapiUrl();
  }

  login(data: any): Observable<any> {
    this.headers = new HttpHeaders(this.headerHlp.get());
    let options = {
      headers: this.headers,
    };
    return this.http.post(`${this.base_url}login`, data, options);
  }

  verifyCode(codigo: any): Observable<any> {
    this.headers = new HttpHeaders(this.headerHlp.getWithToken());
    let options = {
      headers: this.headers,
    };
    return this.http.post(`${this.base_url}codigoverificador/${codigo}`, null, options);
  }

  regenerateCode(): Observable<any> {
    this.headers = new HttpHeaders(this.headerHlp.getWithToken());
    let options = {
      headers: this.headers,
    };
    return this.http.post(`${this.base_url}regenerarcodigo`, null, options);
  }
}
