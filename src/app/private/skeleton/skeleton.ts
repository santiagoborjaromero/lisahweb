import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { Functions } from '../../core/helpers/functions.helper';
import { Sessions } from '../../core/helpers/session.helper';
import { CommonModule } from '@angular/common';
import moment from 'moment';
import { Global } from '../../core/config/global.config';
import { RouterOutlet } from '@angular/router';
import Swal from 'sweetalert2';
import { GeneralService } from '../../core/services/general.service';

@Component({
  selector: 'app-skeleton',
  imports: [CommonModule, RouterOutlet],
  templateUrl: './skeleton.html',
  styleUrl: './skeleton.scss',
  standalone: true
})
export class Skeleton {
  @ViewChild('btnClose') btnClose: ElementRef | undefined
  @ViewChild('btnClose2') btnClose2: ElementRef | undefined
  // @ViewChild('offcanvasDarkNavbar') offcanvasDarkNavbar: ElementRef | undefined
  // @ViewChild('offProfile') offProfile: ElementRef | undefined

  private readonly func = inject(Functions)
  private readonly sessions = inject(Sessions)
  private readonly generalSvc = inject(GeneralService)

  current_year = moment().format("YYYY");
  costumer = Global.costumer;
  product = Global.product;
  acronym = Global.acronym;
  
  barra_menu: boolean = true;
  
  /** Usuario */
  idusuario = 0;
  user:any = {};
  lstNotificaciones: Array<any> = [
    {id: 1, label: "Proceso 12 Realizado"},
    {id: 2, label: "Proceso 14 Realizado"},
    {id: 3, label: "Proceso 18 Realizado"},
    {id: 4, label: "Proceso 22 Realizado"},
  ];
  lstMenuOriginal: Array<any> = [];
  lstMenu: Array<any> = [];

ngOnInit(): void {
  this.user = JSON.parse(this.sessions.get("user"));
  if (this.user){
    // console.log(this.user)
    if (this.user.grupo && this.user.grupo.rolmenugrupos){
      // console.log("Por grupo de Usuarios el Menu")
      this.user.grupo.rolmenugrupos.forEach( (rm:any)=>{
        this.lstMenuOriginal.push(rm.rolmenu[0].menu[0])
      })
      // this.lstMenuOriginal = this.user.grupo.rolmenugrupos;
    }else{
      // console.log("Por Roles el Menu")
      this.lstMenuOriginal = this.user.roles.menu;
    }

    this.lstMenuOriginal.sort((a:any, b:any) =>
      a.orden.localeCompare(b.orden)
    );

    this.lstMenuOriginal.forEach((e:any)=>{
      if (e.es_submenu == 1){
        e["child"] = []
        this.lstMenu.push(e);
      } else {
        this.lstMenu.forEach((l)=>{
          if (l.orden == e.orden.substring(0,2)){
            l["child"].push(e)
          }
        })
      }
    })

    // console.log(this.lstMenu)

  }

}

ngOnDestroy(): void {
  
}

closeSession(confirmed = false){
  
  Swal.fire({
      allowOutsideClick: false,
      allowEscapeKey: false,
      title: 'Pregunta',
      text: `Desea salir del sistema`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#33a0d6',
      confirmButtonText: 'Confirmar',
      cancelButtonColor: '#f63c3a',
      cancelButtonText: 'Cancelar, no salir',
      showClass: { backdrop: 'swal2-noanimation', popup: '' },
      hideClass: { popup: '' },
    }).then(res => {
      if (res.isConfirmed) {
        this.generalSvc.apiRest("POST", "logout").subscribe({
          next: (resp: any) => {
            this.func.closeSwal();
            if (resp.status) {
              this.func.toast("success", resp.message);
              setTimeout(()=>{
                this.sessions.set("statusLogged", "false")
                this.sessions.set("ruta", "")
                this.func.goRoute("login");
              })
            } else {
              this.func.handleErrors("Logout", resp.message);
            }
          },
          error: (err: any) => {
            this.func.closeSwal();
            this.func.handleErrors("Logout", err);
          },
        });
      }
    });
  }



  execRuta(ruta: string){
    let obj = ruta.split("|");
    this.sessions.set("ruta", ruta)
    this.btnClose?.nativeElement.click();
    this.func.goRoute(`/admin/${obj[3]}`, false, false);
  }
  
  profile(){
    this.btnClose2?.nativeElement.click();
    this.func.goRoute(`/admin/profile`, false, false);
  }


}
