import { Injectable } from '@angular/core'
import * as CryptoJS from 'crypto-js';
import { Global } from "../config/global.config";

@Injectable({
  providedIn: 'root',
})

export class Encryption {
  constructor() {
  }

  encryp(value:any){
    var key = CryptoJS.enc.Utf8.parse(Global.secret);
    var iv = CryptoJS.enc.Utf8.parse(Global.secret);
    var encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(value.toString()), key,
    {
        keySize: 128 / 8,
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });

    let res = encrypted.toString()
    return res;
  }

  decrypt(value:any){
    var key = CryptoJS.enc.Utf8.parse(Global.secret);
    var iv = CryptoJS.enc.Utf8.parse(Global.secret);
    var decrypted = CryptoJS.AES.decrypt(value, key, {
        keySize: 128 / 8,
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  }

}