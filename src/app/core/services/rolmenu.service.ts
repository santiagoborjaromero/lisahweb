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
export class RolMenuService {
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

  getRolMenuClient(): Observable<any> {
    this.headers = new HttpHeaders(this.headerHlp.getWithToken());
    let options = {
      headers: this.headers,
    };
    return this.http.get(`${this.base_url}rolmenu_client`, options);
  }

}
