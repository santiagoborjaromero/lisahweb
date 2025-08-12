import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Sessions } from '../../../core/helpers/session.helper';
import { Functions } from '../../../core/helpers/functions.helper';
import { ServidorService } from '../../../core/services/servidor.service';
import { WSService } from '../../../core/services/ws.service';
import iconsData from '../../../core/data/icons.data';
import { Workspace } from '../workspace';
import { Global } from '../../../core/config/global.config';

export interface Datos {
    agente_status: string,
}; 

@Component({
  selector: 'app-store',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './store.html',
  styleUrl: './store.scss'
})
export class Store implements OnInit{
  private readonly route = inject(ActivatedRoute);
  private readonly sessions = inject(Sessions);
  private readonly func = inject(Functions);
  private readonly serverSvc = inject(ServidorService);
  private readonly agente = inject(WSService);
  private readonly parent = inject(Workspace);

  Title = "Almacenamiento";
  TAB = "store"

  user:any | undefined;
  work:any | undefined;
  icono = iconsData;

  lstDatos:Datos;
  global = Global;

  constructor(){
    this.parent.findTab(this.TAB);
    this.lstDatos = {
      agente_status: "Desconectado",
    }
  }
  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get("user"));
    this.work = JSON.parse(this.sessions.get("work"));
    // this.openConn()
  }

  openConn(){
    this.agente.connect(this.work).subscribe({
      next: (resp)=>{
        console.log("Sentinel->", resp)
        if (resp){
          let result = resp.healthy_agente.split("|");
          if (result[0] == "OK"){
            this.lstDatos.agente_status = result[1];
            this.parent.cansee = true;
            // this.onSendCommands();
          } else{
            this.lstDatos.agente_status = result[1];
            this.parent.cansee = false;
          }
          
          // setTimeout(()=>{
          //   this.agente.disconnect(this.work.idservidor);
          // },1000)
        }
      },
      error: (err)=>{
        console.log("Error", err)
        this.func.handleErrors("Almacenamiento", err);
      },
    })
  }


}
