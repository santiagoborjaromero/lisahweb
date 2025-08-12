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
    uptime : string,
    agente_status: string,
    ssh_status: string,
    disco: {
      total: string,
      usado: string,
      libre: string,
      porcentaje: string
    },
    memoria: {
      total: string,
      usado: string,
      libre: string,
      porcentaje: string
    },
    cpu: {
      t1: string,
      t5: string,
      t15:string,
      porcentaje: string
    },
    release: any,
    servicios: any,
    infocpu: any,
  };

@Component({
  selector: 'app-general',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './general.html',
  styleUrl: './general.scss',
  standalone: true
})
export class General implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly sessions = inject(Sessions);
  private readonly func = inject(Functions);
  private readonly serverSvc = inject(ServidorService);
  private readonly agente = inject(WSService);
  private readonly parent = inject(Workspace);

  user:any | undefined;
  work:any | undefined;
  icono = iconsData;
  global = Global;

  loading:boolean = false;

  lstServicios: Array<any> = [];
  lstRecursos: any = {};
  lstDatos:Datos;
  
  constructor(){
    this.parent.findTab("dashboard");
    this.lstDatos = {
      uptime: "0d 00:00:00",
      agente_status: "Desconectado",
      ssh_status: "",
      disco: {
        total: "0",
        usado: "0",
        libre: "0",
        porcentaje: "0"
      },
      memoria: {
        total: "0",
        usado: "0",
        libre: "0",
        porcentaje: "0"
      },
      cpu: {
        t1: "0",
        t5: "0",
        t15:"0",
        porcentaje: "0"
      },
      release: [],
      servicios: [],
      infocpu: [],
    }
  }
  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get("user"));
    this.work = JSON.parse(this.sessions.get("work"));
    this.initial();
    this.openConn()
  }

  initial(){
    this.lstDatos = {
      uptime: "0d 00:00:00",
      agente_status: "Desconectado",
      ssh_status: "",
      disco: {
        total: "0",
        usado: "0",
        libre: "0",
        porcentaje: "0"
      },
      memoria: {
        total: "0",
        usado: "0",
        libre: "0",
        porcentaje: "0"
      },
      cpu: {
        t1: "0",
        t5: "0",
        t15:"0",
        porcentaje: "0"
      },
      release: [],
      servicios: [],
      infocpu: [],
    }
  }

  openConn(){
    this.loading = true;
    this.agente.connect(this.work).subscribe({
      next: (resp)=>{
        console.log("Sentinel->", resp)
        if (resp){
          let result = resp.healthy_agente.split("|");
          if (result[0] == "OK"){
            this.lstDatos.agente_status = result[1];
            this.onSendCommands();
          } else{
            this.loading = false;
            this.initial();
            this.lstDatos.agente_status = result[1];
          }
          
          // setTimeout(()=>{
          //   this.agente.disconnect(this.work.idservidor);
          // },1000)
        } else {
          this.lstDatos.agente_status = "Desconectado";
        }
      },
      error: (err)=>{
        this.loading = false;
        console.log("Error", err)
        this.func.handleErrors("Dashboard", err);
      },
    })
  }
  /*
    {"id": "servicio_httpd", "cmd":"systemctl is-active httpd"},
    {"id": "servicio_ssh", "cmd":"systemctl is-active sshd"},
  */

  onSendCommands(){
    let params = {
      action: "comando",
      identificador: {
        idcliente: this.user.idcliente,
        idusuario: this.user.idusuario,
        idservidor: this.work.idservidor,
        id: Math.floor(Math.random() * (9999999999999999 - 1000000000000000 + 1)) + 1000000000000000
      },
      data: [
        {"id": "disco", "cmd":" df -hT | grep -E 'ext4|xfs|btrfs' | awk '{print $3, $4, $5, $6}'"},
        {"id": "cpu", "cmd":"cat /proc/loadavg | awk '{print $1, $2, $3}'"},
        {"id": "cpu_usado", "cmd":`sar -u | grep '^[0-9]' | awk '{sum+=$3; count++} END {if(count>0) print sum/count}'`},
        {"id": "memoria", "cmd":"free -h | grep -E 'Mem' | awk '{print $2, $3, $4}'"},
        {"id": "uptime", "cmd":'sec=$(( $(date +%s) - $(date -d "$(ps -p 1 -o lstart=)" +%s) )); d=$((sec/86400)); h=$(( (sec%86400)/3600 )); m=$(( (sec%3600)/60 )); s=$((sec%60)); printf "%02d:%02d:%02d:%02d\n" $d $h $m $s'},
        {"id": "release", "cmd":"cat /etc/os-release"},
        // {"id": "servicios", "cmd":"systemctl list-units --type=service"},
        // {"id": "servicios", "cmd":"systemctl list-units --type=service | tr -s ' ' | tr ' ' '|'"},
        // {"id": "servicios", "cmd":`systemctl list-units --type=service --all  --no-legend`},
        {"id": "servicios", "cmd":`systemctl list-units --type=service --all --no-legend | awk '{print $1","$2","$3","$4,","$5,","$6","$7","$8","$9}'`},
        {"id": "infocpu", "cmd":"cat /proc/cpuinfo"},
      ]
    };

    this.agente.sendCommand(this.work.idservidor, params)
    .then(resp=>{
      console.log("<INC>", resp)
      if (resp){
        let data = resp.data.data;
        let r = "";
        let acum:any = [];
        let aux:any | undefined;
        console.log("D", data)
        data.forEach((d:any)=>{
          switch(d.id){
            case "disco":
              r = d.respuesta.split(" ")
              this.lstDatos.disco.total = r[0];
              this.lstDatos.disco.usado = r[1];
              this.lstDatos.disco.libre = r[2];
              this.lstDatos.disco.porcentaje = r[3]
              break;
            case "memoria":
              r = d.respuesta.split(" ")
              this.lstDatos.memoria.total = r[0];
              this.lstDatos.memoria.usado = r[1];
              this.lstDatos.memoria.libre = r[2];
              let used = parseFloat(r[1].replace("Gi",""));
              let total = parseFloat(r[0].replace("Gi",""));
              // console.log(used, total)
              let a3 = (used / total) * 100;
              this.lstDatos.memoria.porcentaje = this.func.numberFormat(a3,2).toString();
              break;
            case "cpu":
              r = d.respuesta.split(" ")
              this.lstDatos.cpu.t1 = r[0];
              this.lstDatos.cpu.t5 = r[1];
              this.lstDatos.cpu.t15 = r[2];
              break;
            case "cpu_usado":
              this.lstDatos.cpu.porcentaje = (this.func.numberFormat(parseFloat(d.respuesta.replace("\n","")),2)).toString()
              break;
            case "uptime":
              this.lstDatos.uptime = d.respuesta;
              break;
            case "release":
              aux = (d.respuesta.split("\n"));
              acum = [];
              aux.forEach((rs:any)=>{
                if (rs!=""){
                  let rss = rs.replace(/"/g,"");
                  rss = rss.split("=");
                  acum.push(rss)
                }
              })
              this.lstDatos.release = acum;
              break;
            case "infocpu":
              aux = (d.respuesta.split("\n"));
              acum = [];
              aux.forEach((rs:any)=>{
                if (rs != ""){
                  let rss = rs.replace(/"/g,"");
                  rss = rss.split(":");
                  acum.push(rss)
                }
              })
              this.lstDatos.infocpu = acum;
              break;
            case "servicios":
              let rd:any = (d.respuesta.split("\n"));
              acum = [];
              rd.forEach((rs:any)=>{
                if (rs.substring(0,1)!="●"){
                  let rss = rs.split(",");
                  if (rss[0]!="") acum.push(rss)
                }
              })
              this.lstDatos.servicios = acum;
              break;
          }
        })
      }
      this.loading = false;
    })
    .catch(err=>{
      this.func.handleErrors("Dashboard", err);
    })
  }

  onMessageListener(){

  }

  go(ruta=""){
    this.parent.tabactive = ruta;
    this.func.irRuta(`admin/hardening/workspace/${ruta}`);
  }
  




}
