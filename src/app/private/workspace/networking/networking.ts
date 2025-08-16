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
import { MongoService } from '../../../core/services/mongo.service';

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
  private readonly parent = inject(Workspace);
  

  Title = "Redes";
  TAB = "networking"
  area = "firewall";

  user:any | undefined;
  work:any | undefined;
  icono = iconsData;

  agente_status:string = "Desconectado";
  global = Global;
  lstUsuarios:any  = [];
  lstComandos:any  = [];
  lstAcciones:any  = [];
  lstNotificaciones:any  = [];
  lstInterfaces:any  = [];
  lstIntefazData:any  = [];
  activar_acciones: boolean = false;
  playMonitor: boolean = false;
  tiempo_refresco:number = 0;

  chartLegend:boolean = true;

  lstRxData:any = [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  lstTxData:any = [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  lstRxData_err:any = [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  lstTxData_err:any = [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

  dataSetRx:any = [];
  dataSetTx:any = [];

  tmrMonitor:any = null;

  /**
   * Sentinel
   */
  ws: any;
  reconnect: boolean = true;
  light_ws: boolean =false;
  ws_error:number = 0;
  ws_error_limit:number = 3;


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
        text: `Paquetes Recibidos`
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
        text: `Paquetes Enviados`
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
    this.getDataUsuarios();
    this.openWS();
  }

  ngOnDestroy(): void {
    clearInterval(this.tmrMonitor);
    this.ws.close(1000);
    this.ws = null
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
          this.startMonitor();
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

  
  openWS() {
    this.agente_status = "Conectando ...";
    const token = this.sessions.get('token');
    let url = `ws://${this.work.host}:${this.work.agente_puerto}/ws?token=${token}`;
    try{
      this.ws = new WebSocket(url);
      this.ws.onopen = (event: any) => this.onOpenListener(event);
      this.ws.onmessage = (event: any) => this.onMessageListener(event);
      this.ws.onclose = (event: any) => this.onCloseListener(event);
      this.ws.onerror = (event: any) => this.onErrorListener(event);
    }catch(ex){}
  }

  onOpenListener(event: any) {
    if (event.type == 'open') {
      console.log(`√ Conectado ${this.work.idservidor}`);
      this.agente_status = "Conectado";
      this.work.healthy_agente = 'OK|Conectado';
    } else {
      this.agente_status = "No se estableció conexion con Sentinel";
      console.log(`X Desconectado ${this.work.idservidor}`);
      this.work.agente_status = 'FAIL|Desconectado';
    }
  }

  onCloseListener(event: any) {
    // console.log('onCloseListener', event);
    console.log("█ Desconectado")
    console.log(`X Desconectado ${this.work.idservidor}`);
    if (event.code == 1000){
      this.agente_status = "Desconectado manualmente";
      this.ws_error = 0;
    }else{
      this.work.healthy_agente = 'FAIL|Desconectado';
      this.agente_status = "Desconectado";
      if (this.reconnect && this.ws_error < this.ws_error_limit){
        this.ws_error ++;
        setTimeout(()=>{
          this.openWS();
        },1000)
      }
    }
  }

  onErrorListener(event: any) {}

  async onMessageListener(e:any){
    console.log(`↓ Llego Mensaje`);
    let data = JSON.parse(e.data);
    
    this.func.closeSwal()
    let r = "";
    let acum:any = [];
    let aux:any | undefined;
    data.data.forEach((d:any)=>{
      d.respuesta= atob(d.respuesta);
      switch(d.id){
        case `${this.area}|listar`:
          //let rd:any = (d.respuesta.split("\n"));
          // console.log("→", d.respuesta)
          if (d.respuesta.indexOf("firewall-cmd: command not found")>-1){
            this.addNotificaciones({tipo: "FATAL", descripcion: "El servicio de FirewallD no se encuentra instalado"});
            // this.lstNotificaciones.push({tipo: "FATAL", descripcion: "El servicio de FirewallD no se encuentra instalado"});
            // console.log(this.lstNotificaciones)
          } else if (d.respuesta.indexOf("FirewallD is not running")>-1){

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
          break;
      }
    })
  }

  startMonitor(){
    this.playMonitor = true;
    this.ejecutaOperaciones(["listar","interfaces","intefaz_data"]);
    this.tmrMonitor = setInterval(() => {
      this.ejecutaOperaciones(["listar","interfaces","intefaz_data"]);
    }, this.tiempo_refresco *1000);
  }

  stopMonitor(){
    console.log("Deteniendo")
    this.agente_status = "Deteniendo ...";
    this.playMonitor = false;
    clearInterval(this.tmrMonitor);
    this.ws.close(1000)
  }

  buscarComando(area="", accion=""){
    let arr:any = [];
    this.lstComandos.forEach((c:any)=>{
      if (c.area == area && c.accion == accion){
        arr.push({
          id: `${c.area}|${c.accion}`,
          cmd: c.comando
        });
      }
    })
    // console.log(arr)
    return arr;
  }

  ejecutaOperaciones(acciones:any=[]){
    let cmds:any = [];
    acciones.forEach((accion:any)=>{
      // console.log(`→ ${accion} ←`)
      switch(accion){
        default:
          let cmd:any = this.buscarComando(this.area, accion);
          if (Array.isArray(cmd)){
            cmd.forEach((e:any)=>{
              cmds.push(e)
            })
          }else{
            cmds.push(cmd)
          }
          break;
      }
    })
    // console.log("↑", cmds)
    if (!cmds) return 
    let params = {
      action: "comando",
      identificador: {
        idcliente: this.user.idcliente,
        idusuario: this.user.idusuario,
        idservidor: this.work.idservidor,
        usuario: this.user.usuario,
        id: Math.floor(Math.random() * (9999999999999999 - 1000000000000000 + 1)) + 1000000000000000
      },
      data: cmds
    };
    this.onSendCommands(params);
  }


  onSendCommands(params:any=null){
    // this.func.showLoading("Cargando");
    if (this.connState()){
      console.log("↑ Enviando Mensaje")
      this.ws.send(JSON.stringify(params));
    }else{
      this.openWS();
      setTimeout(()=>{
        this.onSendCommands(params)
      },1000)
    }
  }

  connState = () => {
    let m = false;

    if (this.ws === undefined){
       m = false;
    }else{
      try{
        switch (this.ws.readyState){
          case 0:
            //m = "Pepper has been created. The connection is not yet open.";
            m = false;
            break;
          case 1:
            //m = "The connection is open and ready to communicate.";
            m = true;
            break;
          case 2:
            //m = "The connection is in the process of closing.";
            m = false;
            break;
          case 3:
            //m = "The connection is closed or couldn't be opened.";
            m = false;
            break;
        }
      }catch(err){
        m = false;
      }
    }

    this.light_ws = m;
    return m;
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
          rxerr += parseFloat(i[3]);
          tx += parseFloat(i[6]);
          txerr += parseFloat(i[7]);
        }
      });
    });

    rx = rx / count;
    rxerr = rxerr / count;
    tx = tx / count;
    txerr = txerr / count;

    this.lstRxData.splice(0,1);
    this.lstRxData.push(rx);
    this.lstRxData_err.splice(0,1);
    this.lstRxData_err.push(rxerr);

    this.lstTxData.splice(0,1);
    this.lstTxData.push(tx);
    this.lstTxData_err.splice(0,1);
    this.lstTxData_err.push(txerr);

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

  addNotificaciones(data:any){
    //{tipo: "FATAL", descripcion: "El servicio de FirewallD no se encuentra instalado"}
    let found = false;
    this.lstNotificaciones.forEach((e:any) => {
      found = false;
      if (e.descripcion == data.descripcion){
        found = true;
      }
    });
    if (!found){
      this.lstNotificaciones.push(data);
    }
  }

}
