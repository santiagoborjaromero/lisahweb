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
import Swal from 'sweetalert2';

@Component({
  selector: 'app-networking',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './networking.html',
  styleUrl: './networking.scss',
  standalone: true
})
export class Networking implements OnInit{
private readonly route = inject(ActivatedRoute);
  private readonly sessions = inject(Sessions);
  private readonly func = inject(Functions);
  private readonly serverSvc = inject(ServidorService);
  private readonly agente = inject(WSService);
  private readonly parent = inject(Workspace);

  Title = "Redes";
  TAB = "networking"

  user:any | undefined;
  work:any | undefined;
  icono = iconsData;

  agente_status:string = "";
  global = Global;
  area = "firewall";
  lstUsuarios:any  = [];
  lstComandos:any  = [];
  lstAcciones:any  = [];
  lstNotificaciones:any  = [];
  lstInterfaces:any  = [];
  activar_acciones: boolean = false;

  constructor(){
    this.parent.findTab(this.TAB);
    this.lstAcciones = [
      {
        accion: "instalar", 
        titulo:"Instalar Firewall", 
        subtitulo: "",
        condicion: true,
      },
    ];
  }
  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get("user"));
    this.work = JSON.parse(this.sessions.get("work"));
    this.initial();
  }

  initial(){
    this.getDataUsuarios();
  }

  getDataUsuarios() {
    this.lstUsuarios = [];
    this.func.showLoading('Cargando');

    this.serverSvc.getOneWithUsers(this.work.idservidor).subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        if (resp.status) {
          if (resp.data[0].usuarios.length > 0){
            resp.data[0].usuarios.forEach((e:any)=>{
              e["servidor"] = null;
              this.lstUsuarios.push(e)
            })
          }
          if (resp.data[0].comandos.length > 0){
            this.lstComandos = resp.data[0].comandos;
          }
          this.ejecutaOperaciones("listar");
          setTimeout(()=>{ this.ejecutaOperaciones("interfaces"); },500)
        } else {
          this.func;
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
      },
    });
  }

  buscarComando(area="", accion=""){
    let arr:any = [];
    // console.log(this.lstComandos,area,accion)
    this.lstComandos.forEach((c:any)=>{
      if (c.area == area && c.accion == accion){
        arr.push({
          id: `${c.area}|${c.accion}`,
          cmd: c.comando
        });
      }
    })
    console.log(arr)
    return arr;
  }

  openConn(data:any = null) {
    this.agente.connect(this.work).subscribe({
      next: (resp) => {
        // console.log('↓ Sentinel Status', resp);
        if (resp) {
          let result = resp.healthy_agente.split('|');
          this.agente_status = result[1];
          if (result[0] == 'OK') {
            this.onSendCommands(data);
          }
        }
      },
      error: (err) => {
        console.log('Error', err);
      },
    });
  }

  onSendCommands(params:any){
    this.agente.sendCommand(this.work.idservidor, params)
    .then(resp=>{
      console.log("↓ Sentinel response", resp)
      if (resp){
        let data = resp.data.data;
        this.onMessageListener(data);
      } 
    })
    .catch(err=>{
      console.log(err)
    })
  }

  onMessageListener(data:any=[]){
    let r = "";
    let acum:any = [];
    let aux:any | undefined;
    data.forEach((d:any)=>{
      switch(d.id){
        case `${this.area}|listar`:
          //let rd:any = (d.respuesta.split("\n"));
          console.log("->>>>", d.respuesta)

          if (d.respuesta.indexOf("firewall-cmd: command not found")>-1){
            this.lstNotificaciones.push({tipo: "FATAL", descripcion: "El servicio de FirewallD no se encuentra instalado"});
            console.log(this.lstNotificaciones)
          } else if (d.respuesta.indefOf("FirewallD is not running")>-1){

          }
          break;
        case `${this.area}|interfaces`:
            aux = (d.respuesta.split("\n"));
            acum = [];
            aux.forEach((rs:any, idx:any)=>{
              let rss = rs.split(",");
              if (rs != "" && idx>0){
                acum.push(rss)
              }
            })
            this.lstInterfaces = acum;
          break;
        default:
          // this.initial();
          break;
      }
    })
  }
  operaciones(que=""){
    let found = false;
    let leyenda = "";
    this.lstAcciones.forEach((c:any)=>{
      if (c.accion == que){
        leyenda = c.titulo;
        found = true;
      }
    })

    if (found){
      Swal.fire({
        allowOutsideClick: false,
        allowEscapeKey: false,
        title: 'Pregunta',
        text: `Para ${leyenda}, debe escribir la palabra ${que}.`,
        icon: 'question',
        input: 'text',
        inputPlaceholder: que,
        showCancelButton: true,
        confirmButtonColor: '#33a0d6',
        confirmButtonText: 'Confirmar',
        cancelButtonColor: '#f63c3a',
        cancelButtonText: 'Cancelar',
        showClass: { backdrop: 'swal2-noanimation', popup: '' },
        hideClass: { popup: '' },
        inputValidator: (text) => {
          return new Promise((resolve) => {
            if (text.trim() !== '' && text.trim() == que) {
              resolve('');
            } else {
              resolve(`Para ${leyenda}, debe ingresar ${que}.`);
            }
          });
        },
      }).then((res) => {
        if (res.isConfirmed) {
          this.ejecutaOperaciones(que);
        }
      });
    }
  }

  ejecutaOperaciones(accion=""){
    console.log(`→ ${accion} ←`)
    let cmd:any = null;
    switch(accion){
      default:
        cmd = this.buscarComando(this.area, accion);
        break;
    }

    console.log("↑", cmd);
    if (!cmd) return 
    let params = {
      action: "comando",
      identificador: {
        idcliente: this.user.idcliente,
        idusuario: this.user.idusuario,
        idservidor: this.work.idservidor,
        id: Math.floor(Math.random() * (9999999999999999 - 1000000000000000 + 1)) + 1000000000000000
      },
      data: cmd
    };
    this.openConn(params);
  }

}
