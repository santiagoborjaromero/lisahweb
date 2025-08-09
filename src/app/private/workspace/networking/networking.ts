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
import { Chart, ChartConfiguration, ChartOptions, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { color } from 'chart.js/helpers';

Chart.register(...registerables);

@Component({
  selector: 'app-networking',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, BaseChartDirective],
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
  lstIntefazData:any  = [];
  activar_acciones: boolean = false;
  tiempo_refresco:number = 0;

  chartLegend:boolean = true;

  lstRxData:any = [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  lstTxData:any = [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  lstRxData_err:any = [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  lstTxData_err:any = [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

  dataSetRx:any = [];
  dataSetTx:any = [];

  tmrMonitor:any = null;

  public rxChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [],
  }

  public rxChartOptions: ChartOptions = {
    responsive: true,
    plugins:{
      legend:{
        position: 'bottom'
      },
      title:{
        display: true,
        text: `Paquetes recibidos exitosamente`
      }
    },
    indexAxis: 'x',
    scales: {
      y: {
          beginAtZero: true
      }
    }
  };
  public txChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [],
  }

  public txChartOptions: ChartOptions = {
    responsive: true,
    plugins:{
      legend:{
        position: 'bottom'
      },
      title:{
        display: true,
        text: `Paquetes enviados exitosamente`
      }
    },
    indexAxis: 'x',
    scales: {
      y: {
          beginAtZero: true
      }
    }
  };

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

    // this.dataSetRx.push({
    //   data: [],
    //   label: "RX",
    //   fill: true,
    //   tension: 0.1,
    //   borderColor: 'black',
    //   borderWidth: 0,
    //   backgroundColor: 'rgba(41, 219, 204, 0.79)'
    // });
    // this.dataSetTx.push({
    //   data: [],
    //   label: "TX",
    //   fill: true,
    //   tension: 0.1,
    //   borderColor: 'black',
    //   borderWidth: 0,
    //   backgroundColor: 'rgba(219, 148, 41, 0.79)'
    // });

    this.dataSetRx.push({
      data: [],
      label: "RX OK",
      fill: true,
      tension: 0.1,
      borderColor: 'black',
      borderWidth: 0,
      backgroundColor: 'rgba(41, 219, 204, 0.79)'
    });

    this.dataSetRx.push({
      data: [],
      label: "RX FAIL",
      fill: true,
      tension: 0.1,
      borderColor: 'black',
      borderWidth: 0,
      backgroundColor: 'rgba(207, 20, 20, 0.62)'
    });
    this.dataSetTx.push({
      data: [],
      label: "TX OK",
      fill: true,
      tension: 0.1,
      borderColor: 'black',
      borderWidth: 0,
      backgroundColor: 'rgba(212, 210, 74, 0.81)'
    });

    this.dataSetTx.push({
      data: [],
      label: "TX FAIL",
      fill: true,
      tension: 0.1,
      borderColor: 'black',
      borderWidth: 0,
      backgroundColor: 'rgba(207, 20, 20, 0.62)'
    });
  }

  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get("user"));
    this.work = JSON.parse(this.sessions.get("work"));
    this.tiempo_refresco = this.user.config.tiempo_refresco;
    this.initial();
    setTimeout(()=>{ this.timer() },2000)
  }
  
  timer(){
    this.ejecutaOperaciones("intefaz_data");
    this.tmrMonitor = setInterval(()=>{
      this.ejecutaOperaciones("intefaz_data");
    }, this.tiempo_refresco * 1000)
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
          
          // setTimeout(()=>{ this.ejecutaOperaciones("intefaz_data"); },1000)
        } else {
          this.func.handleErrors("Server", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
        this.func.handleErrors("Redes", err);
      },
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.tmrMonitor);
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
        this.func.handleErrors("Redes", err);
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
              if (rss != "" && idx>0){
                acum.push(rss)
              }
            })
            this.lstInterfaces = acum;
          break;
        case `${this.area}|intefaz_data`:
            aux = (d.respuesta.split("\n"));
            acum = [];
            aux.forEach((rs:any, idx:any)=>{
              let rss = rs.split(",");
              if (rss != "" && idx>0){
                acum.push(rss)
              }
            })
            this.lstIntefazData = acum;
            this.graph()
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

   graph(){
    let labels:any =  ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20"];
    
    let rx:number = 0;
    let rxerr:number = 0;
    let tx:number = 0;
    let txerr:number = 0;
    let count:number = 0;

    this.lstInterfaces.forEach( (e:any) => {
      this.lstIntefazData.forEach( (i:any) => {
        if (e[2] == i[0]){
          count ++; 
          rx += parseFloat(i[2]);
          rxerr += parseFloat(i[2]);
          tx += parseFloat(i[6]);
          txerr += parseFloat(i[7]);
        }
      });
    });

    rx = rx / count;
    tx = tx / count;

    // console.log(rx, tx)

    this.lstRxData.splice(0,1);
    this.lstRxData.push(rx);

    this.lstRxData_err.splice(0,1);
    this.lstRxData_err.push(rx);

    this.lstTxData.splice(0,1);
    this.lstTxData.push(tx);
    this.lstTxData_err.splice(0,1);
    this.lstTxData_err.push(tx);

    this.dataSetRx[0].data =  this.lstRxData;
    this.dataSetRx[1].data =  this.lstRxData_err;
    this.dataSetTx[0].data =  this.lstTxData;
    this.dataSetTx[1].data =  this.lstTxData_err;
    
    this.rxChartData  = {
      labels: labels,
      datasets: this.dataSetRx
    }

    this.txChartData  = {
      labels: labels,
      datasets: this.dataSetTx
    }
  }

}
