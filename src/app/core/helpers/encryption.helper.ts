import { Injectable } from '@angular/core'
import * as CryptoJS from 'crypto-js';
import { Global } from "../config/global.config";

@Injectable({
  providedIn: 'root',
})

export class Encryption {
  encryp(value:any){
    var key = CryptoJS.enc.Utf8.parse(Global.key);
    var iv = CryptoJS.enc.Utf8.parse(Global.iv);
    var encrypted = CryptoJS.AES.encrypt(value.toString(), key,
    {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });

    let res = CryptoJS.enc.Base64.stringify(encrypted.ciphertext);
    return res;
  }

  decrypt(value:any){
    var key = CryptoJS.enc.Utf8.parse(Global.key);
    var iv = CryptoJS.enc.Utf8.parse(Global.iv);
    var decrypted = CryptoJS.AES.decrypt(value, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });

    let dec = decrypted.toString(CryptoJS.enc.Utf8);
    return dec
  }

  // convertRequest(message:string = "", data:any = null){
  //   console.log("message", message);
  //   console.log("data", data);
  //   let desencriptado_message:string = "";
  //   let desencriptado_data:any = null;

  //   try{
  //     desencriptado_message = this.decrypt(message)
  //   }catch(ex){
  //     console.log(ex)
  //     desencriptado_message = "Existent errores al desencriptar";
  //   }
  //   try{
  //     desencriptado_data = JSON.parse(this.decrypt(data))
  //   }catch(ex){
  //     console.log(ex)
  //     desencriptado_data = "Existent errores al desencriptar";
  //   }
  //   return [desencriptado_message, desencriptado_data]
  // }

  // convertResponse(value:any){
  //   let encriptado = this.encryp(value);
  //   let base64 = btoa(encriptado);
  //   // console.log(base64)
  //   return base64;
  // }

}