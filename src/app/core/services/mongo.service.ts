import { EnvironmentInjector, inject, Injectable } from '@angular/core';
import { Encryption } from '../helpers/encryption.helper';
import { Router } from '@angular/router';
import { Address } from '../helpers/address.helper';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Headers } from '../helpers/headers.helper';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MongoService {
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
    this.base_url = this.addr.getapiUrl(2);
  }

  apiMongo(method:string = "GET", ruta:string="", data: any = null, pvt:boolean = true): Observable<any> {
    this.headers = new HttpHeaders( pvt ? this.headerHlp.getWithToken() : this.headerHlp.get());
    let options = {
      headers: this.headers,
    };
    console.log(method, `${this.base_url}${ruta}`, data)
    switch(method){
      case "GET":
        return this.http.get(`${this.base_url}${ruta}`, options);
      case "PUT":
        return this.http.put(`${this.base_url}${ruta}`, data, options);
      case "POST":
        
        return this.http.post(`${this.base_url}${ruta}`, data, options);
      case "DELETE":
        return this.http.delete(`${this.base_url}${ruta}`, options);
    }
    return this.http.get(`${this.base_url}${ruta}`, options);
  }
}
