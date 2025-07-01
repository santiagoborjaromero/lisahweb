import { EnvironmentInjector, inject, Injectable } from '@angular/core';
import { Encryption } from '../helpers/encryption.helper';
import { Router } from '@angular/router';
import { Address } from '../helpers/address.helper';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { Headers } from '../helpers/headers.helper';
import { Functions } from '../helpers/functions.helper';

@Injectable({
  providedIn: 'root',
})
export class GrupoUsuarioService {
  private readonly func = inject(Functions);

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

  getAll(): Observable<any> {
    this.headers = new HttpHeaders(this.headerHlp.getWithToken());
    let options = {
      headers: this.headers,
    };
    return this.http.get(`${this.base_url}grupousuarios`, options);
  }

  getAllFilters(accion:any=""): Observable<any> {
    this.headers = new HttpHeaders(this.headerHlp.getWithToken());
    let options = {
      headers: this.headers,
    };
    return this.http.get(`${this.base_url}grupousuarios_filter/${accion}`, options);
  }

  getAllFromClient(idcliente:any): Observable<any> {
    this.headers = new HttpHeaders(this.headerHlp.getWithToken());
    let options = {
      headers: this.headers,
    };
    return this.http.get(`${this.base_url}grupousuarios/cliente/${idcliente}`, options);
  }

  getOne(id: any): Observable<any> {
    this.headers = new HttpHeaders(this.headerHlp.getWithToken());
    let options = {
      headers: this.headers,
    };
    return this.http.get(`${this.base_url}grupousuarios/${id}`, options);
  }

  save(id: any = "", data:any = null): Observable<any> {
    this.headers = new HttpHeaders(this.headerHlp.getWithToken());
    let options = {
      headers: this.headers,
    };
    if (id == ""){
      return this.http.post(`${this.base_url}grupousuario`, data, options);
    }else{
      return this.http.put(`${this.base_url}grupousuario/${id}`, data, options);
    }
  }

  delete(id: any): Observable<any> {
    this.headers = new HttpHeaders(this.headerHlp.getWithToken());
    let options = {
      headers: this.headers,
    };
    return this.http.delete(`${this.base_url}grupousuario/${id}`, options);
  }

  recovery(id: any): Observable<any> {
    this.headers = new HttpHeaders(this.headerHlp.getWithToken());
    let options = {
      headers: this.headers,
    };
    return this.http.put(`${this.base_url}grupousuario_recuperar/${id}`, null, options);
  }

 
}
