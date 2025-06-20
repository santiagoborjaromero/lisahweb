import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment'

@Injectable({
  providedIn: 'root'
})
export class Address {
  constructor() {}
    getapiUrl = (what=1):string  =>  {
      let url = environment.apimysql;
      if (what==2) url = environment.apimongo;
      return url;
    }
}
