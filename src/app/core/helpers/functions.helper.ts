import { Injectable, inject } from '@angular/core';
import { Encryption } from './encryption.helper';
import { Sessions } from '../helpers/session.helper';
import moment from 'moment';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { Auth } from '../services/auth.service';
import { Global } from '../config/global.config';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root',
})
export class Functions {
  private readonly authSvc = inject(Auth);
  private readonly sessions = inject(Sessions);
  private readonly router = inject(Router);

  public toFloat(value: string): number {
    return parseFloat(value);
  }

  nombreMes(nmes: number) {
    let nommes = '';
    switch (nmes) {
      case 1:
        nommes = 'Enero';
        break;
      case 2:
        nommes = 'Febrero';
        break;
      case 3:
        nommes = 'Marzo';
        break;
      case 4:
        nommes = 'Abril';
        break;
      case 5:
        nommes = 'Mayo';
        break;
      case 6:
        nommes = 'Junio';
        break;
      case 7:
        nommes = 'Julio';
        break;
      case 8:
        nommes = 'Agosto';
        break;
      case 9:
        nommes = 'Septiembre';
        break;
      case 10:
        nommes = 'Octubre';
        break;
      case 11:
        nommes = 'Noviembre';
        break;
      case 12:
        nommes = 'Diciembre';
        break;
    }
    return nommes;
  }

  numberFormat(n: number, dec = 2) {
    return n.toLocaleString('en-US', {
      maximumFractionDigits: dec,
      minimumFractionDigits: dec,
    });
  }

  truncate(num: any): number {
    let transf = num.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];
    return parseFloat(transf);
  }

  round(num: any, dec: any) {
    return parseFloat(num.toFixed(dec));
  }

  handleErrors = (title: string = '', error: any = null) => {
    let e = JSON.stringify(error).toLowerCase();
    let msgError = e;
    let match = false;

    if (!match) {
      if (error.hasOwnProperty('message')) {
        msgError = error.message;
        match = true;
      }
    }

    if (!match) {
      if (error.hasOwnProperty('detail')) {
        msgError = error.detail.toLowerCase();
        match = true;
      }
    }

    console.log(msgError)

    let errs = [
      {
        message: 'http failure response',
        messageResult: '<strong>Unable to connect the server !!!</strong><br>Http failure response',
        action: '',
      },
      {
        message: 'unknown error',
        messageResult: '<strong>Unable to connect the server !!!</strong><br>Unknown error',
        action: '',
      },
      {
        message: 'httperrorresponse',
        messageResult: '<strong>Unable to connect the server !!!</strong><br>HttpErrorResponse',
        action: '',
      },
      {
        message: 'token expirado',
        messageResult: 'Token de seguridad expiró',
        action: 'logout',
      },
    ];

    let action = '';
    for (let er of errs) {
      if (msgError.indexOf(er.message) > -1) {
        msgError = er.messageResult;
        if (er.action != '') {
          action = er.action;
        }
      }
    }

    // console.log('Error', e);
    // console.log(msgError, action)
    if (action == '') {
      this.showMessage('error', title, msgError);
    } else {
      this.showMessage('error', title, msgError);
      setTimeout(()=>{
        if (action == 'logout') {
          this.sessions.set('user', "");
          this.sessions.set('statusLogged', 'false');
          this.sessions.set('token', "");
          this.sessions.set('form', "");
          this.router.navigate(['/login']);
        }
      },4000)
    }
  };


  showMessage(type: any, title: any, msg: any, width=0) {
    let that = this;
    let params:any = {
      allowOutsideClick: false,
      allowEscapeKey: false,
      title: title,
      html: msg,
      icon: type,
      footer: Global.acronym + " " + Global.appversion,
      showClass: { backdrop: 'swal2-noanimation', popup: '' },
      hideClass: { popup: '' },
    };
    if (width>0){
      params.width = `${width}px`;
    }
    Swal.fire(params);
  }

  closeSwal() {
    if (Swal.isVisible()) Swal.close();
  }

  showLoading(text = '', time = 0) {
    let timerInterval: any;
    Swal.fire({
      allowOutsideClick: false,
      allowEscapeKey: false,
      title: text,
      text: 'Espere un momento',
      timer: time > 0 ? time * 1000 : 0,
      timerProgressBar: true,
      footer: Global.acronym + " " + Global.appversion,
      showClass: { backdrop: 'swal2-noanimation', popup: '' },
      hideClass: { popup: '' },
      didOpen: () => {
        Swal.showLoading();
        if (time > 0) {
          timerInterval = setInterval(() => {
            const content = Swal.getHtmlContainer();
            if (content) {
              const b: any = content.querySelector('b');
              if (b) {
                b.textContent = Swal.getTimerLeft();
              }
            }
          }, 100);
        }
      },
      willClose: () => {
        clearInterval(timerInterval);
      },
    }).then((result: any) => {
      /* Read more about handling dismissals below */
      if (result.dismiss === Swal.DismissReason.timer) {
        //console.log('I was closed by the timer');
      }
    });
  }

  async goRoute(ruta: string = '', isedit = false, isreturn=false, isOther=false) {
    if (isedit){
      let ruta_partes = ruta.split("/");
      this.sessions.set("ruta_old", this.sessions.get("ruta"));
      let obj = this.sessions.get("ruta") + "|Edit";
      if (isOther){
        obj =  this.sessions.get("ruta") + "|" + ruta_partes[ruta_partes.length-1];
      }
      this.sessions.set("ruta", obj);
    }
    if (isreturn){
      this.sessions.set("ruta", this.sessions.get("ruta_old"));
      this.sessions.set("ruta_old", "");
    }

    this.router.navigate([`/${ruta}`], {
      replaceUrl: true,
      skipLocationChange: false,
    });
    // this.navCtrl.navigateForward(ruta);
  }

  async irRuta(ruta: string = '') {
    this.router.navigate([`/${ruta}`], {
      replaceUrl: true,
      skipLocationChange: false,
    });
  }

  validaCampos(objValida:Array<any> = [], campos:any = {}, que = ''){
    let error = false;
    let keys = Object.keys(objValida);
    
    keys.forEach((key:any)=>{
      if (que=="" || que == key){
        if (objValida[key].requerido){

          objValida[key].validacion.resultado = "";
          
          // console.log(objValida[key].etiqueta)
          if (objValida[key].etiqueta == "Lógico"){
          }else{
            if ( Array.isArray(campos[key]) ){
              if (campos[key].length == 0){
                error = true;
                objValida[key].validacion.resultado = objValida[key].validacion.patron_descripcion;
              }
            }else{
              if (!objValida[key].validacion.pattern.exec(campos[key])){
                error = true;
                objValida[key].validacion.resultado = objValida[key].validacion.patron_descripcion;
              }
            }
          }
  
        }
      }
    });
    // console.log(error)
    return error
  }

  
  encerarCampos(objValida:Array<any> = []){
    let keys = Object.keys(objValida);
    keys.forEach((key:any)=>{
      objValida[key].validacion.resultado = "";
    });
    return true
  }

  exportarPDF(params:any){
      var doc = new jsPDF({
        orientation: params.orientation,
        format: 'A4',
        unit: 'mm'
      });
  
      autoTable(doc, {
        body: [
          [
            {
              content: params.titulo,
              styles: {
                halign: 'left',
                fontSize: 20,
                textColor: '#062974ff'
              }
            },
          ],
          [
            {
              content: 'Fecha reporte: ' + moment().format("YYYY-MM-DD HH:mm:ss"),
              styles: {
                halign: 'left',
                fontSize: 10,
                textColor: '#062974ff'
              }
            },
          ],
        ],
        theme: 'plain',
      });
  
      const [records, columnStyles] = this.transformarDatosPDF(params.data)
      // console.log(columnStyles)
  
      autoTable(doc, {
          head: [records[0]],
          body: records.slice(1),
          theme: 'striped',   //grid (con lineas), striped (la mejor), plain (plano todo)
          headStyles:{
            fillColor: '#dadada',
            textColor: '#000'
          },
          styles:{
            textColor: '#000'
          },
          // columnStyles: columnStyles
      });
  
      doc.save(params.filename);
    }

  transformarDatosPDF(array:any = []){

    const data:any = [];
    const columnStyles:any = [];
    let cabecera = Object.keys(array[0]);
    let may:any = [];
    let head:any ;
    cabecera.forEach((c:any, idx:any)=>{
      columnStyles.push({
          halign: 'left',
          tableWidth: 100,
      })
      may.push(this.capital(c.replace(/_/g, " ")));
    });
    data.push(may);

    let temp = [];
    let d = "";
    for (var i = 0; i < array.length; i++) {
        temp = [];
        for (var index in array[i]) {
          d = this.textosLargos(array[i][index] == null ? '' : array[i][index]);
          temp.push(d);
        }
        data.push(temp)
    }
    return [data,columnStyles];
  }

  textosLargos(texto:string = ""){
    let textoTratado:string = texto;
    try{
      textoTratado = textoTratado.replace(/,/g, ", ")
    }catch(err){
      // console.log("Error textosLargos", err)
    }
    return textoTratado
  }

  exportarCSV(data:any= [], filename:string ="data.csv"){
    let csv = [];

    let header = Object.keys(data[0]);
    csv.push(header.join(","));
    
    data.forEach((e:any) => {
      let valor = header.map((field) => this.scapeCSV(e[field]))
      csv.push(valor.join(","));
    });
    
    let export_data = csv.join("\n");

    let blob = new Blob([export_data], {type: "text/csv;charset=utf-8;"})
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.setAttribute("style", "display:none");
    document.body.appendChild(a)
    a.download = filename;
    a.href = url;
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  scapeCSV(valor:any):string{
    if (typeof valor === "string"){
      let v = valor.replace(/"/g ,"'");
      v = v.replace(/,/g ,";");
      // v = v.replace(/[/]/g ,";");
      return v
    }else{
      return valor
    }
  }

  toast(type:any="success", title:string =""){
    Swal.fire({
      position: "top-end",
      icon: type,
      title: title,
      showConfirmButton: false,
      timer: 1500
    });
  }

  capital(str:any){
    return str.charAt(0).toUpperCase() + str.slice(1);
  }


  colores(){
    return [
      'rgba(54, 162, 235, 0.59)',
      'rgba(255, 159, 64, 0.79)',
      'rgba(255, 99, 132, 0.79)',
      'rgba(41, 219, 204, 0.79)',
      'rgba(255, 205, 86, 0.79)',
      'rgba(75, 192, 192, 0.79)',
      'rgba(153, 102, 255, 0.79)',
      'rgba(201, 203, 207, 0.7)'
    ]
  }



}

