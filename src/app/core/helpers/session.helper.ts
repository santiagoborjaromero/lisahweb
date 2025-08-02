import { Injectable, inject } from '@angular/core';
import { Global } from '../config/global.config';
import { Encryption } from './encryption.helper';

@Injectable({
  providedIn: 'root'
})
export class Sessions {
  private readonly encryp = inject(Encryption);

  
  clear = () => {
      sessionStorage.clear();
  }

  get = (key:string) => {
    let content: any ;
    let key_to_search:string = `${Global.prefix_storage}${key}`;
    try {
      let sess = sessionStorage.getItem(key_to_search);
      content = this.encryp.decrypt(sess!);
    } catch (ex) {
      content = sessionStorage.getItem(key);
    }
    return content;
  };


  set = (key:any, data:any): void => {
    try {
      sessionStorage.setItem(`${Global.prefix_storage}${key}`,this.encryp.encryp(data));
    } catch (ex) {}
  };
}
