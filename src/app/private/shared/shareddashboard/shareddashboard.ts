import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, input, Input, signal, SimpleChanges, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Sessions } from '../../../core/helpers/session.helper';
import { Functions } from '../../../core/helpers/functions.helper';
import { GeneralService } from '../../../core/services/general.service';
import { Chart, ChartConfiguration, ChartOptions, registerables } from 'chart.js';
import iconsData from '../../../core/data/icons.data';
import { Global } from '../../../core/config/global.config';
import { AllCommunityModule, createGrid, GridApi, GridOptions, ICellRendererParams, ModuleRegistry } from 'ag-grid-community';
import { BaseChartDirective } from 'ng2-charts';
import moment from 'moment';


Chart.register(...registerables);
ModuleRegistry.registerModules([AllCommunityModule]);
@Component({
  selector: 'app-shareddashboard',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, BaseChartDirective],
  templateUrl: './shareddashboard.html',
  styleUrl: './shareddashboard.scss',
  standalone: true
})
export class Shareddashboard {
  // @Input() server: any | undefined;

  private readonly sessions = inject(Sessions);
  private readonly func = inject(Functions);
  private readonly generalSvc = inject(GeneralService);

  server = input<any>({usuarios: []});

  user:any | undefined;
  work:any = {
    host:"",
    ssh_puerto: 0,
    agente_puerto:0,
  };
  icono = iconsData;
  global = Global;

  loading:boolean = false;
  playMonitor:boolean = false;

  public dtOptions: any = {};
  public gridOptions: GridOptions<any> = {};
  public gridApi?: GridApi<any>;
  public id_selected: string = '';

  public dtOptionsProc: any = {};
  public gridOptionsProc: GridOptions<any> = {};
  public gridApiProc?: GridApi<any>;
  public id_selectedProc: string = '';

  public is_deleted: any = null;
  public name_selected: string = '';
  public rows_selected: any = 0;
  public server_selected: any = {};

  alto:string =  ((screen.height / 2)-225).toString();

  lstCfg: any;
  lstAcciones: Array<any> = [];
  lstUltimasAcciones: Array<any> = [];
  lstServicios: Array<any> = [];
  lstRecursos: any = {};
  lstDatos:any = [];
  tmrMonitor:any = null;
  tiempo_refresco:number = 10;
  paginacion = 50;

  chartLegend:boolean = false;
  idservidor:any ;

  dataset1:any = [];
  dataset2:any = [];
  dataset3:any = [];

  lstCpuData1:any = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  lstCpuData5:any = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  lstCpuData15:any = [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  labelsCpu: any =  ["","","","","","","","","","","","","","","","","","","",""];
  labelsPro: any =  ["","","","","","","","","","","","","","","","","","","",""];
  labelsRed: any =  ["","","","","","","","","","","","","","","","","","","",""];
  lstProData1:any = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  lstProData2:any = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  lstRedData1:any = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  lstRedData2:any = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

  agente_status:string =  "Desconectado";
  /**
   * Sentinel
   */
  ws: any;
  reconnect: boolean = true;
  light_ws: boolean =false;
  ws_error:number = 0;
  ws_error_limit:number = 3;

  public cpuChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [],
  }

  public cpuChartOptions: ChartOptions = {
    responsive: true,
    plugins:{
      legend:{
        position: 'bottom'
      },
      title:{
        display: true,
        text: `Rendimiento CPU %`
      }
    },
    indexAxis: 'x',
    scales: {
      y: {
          beginAtZero: true
      }
    }
  };

  public proChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [],
  }

  public proChartOptions: ChartOptions = {
    responsive: true,
    plugins:{
      legend:{
        position: 'bottom'
      },
      title:{
        display: true,
        text: `Transmisión (RX/TX)`
      }
    },
    indexAxis: 'x',
    scales: {
      y: {
          beginAtZero: true
      }
    }
  };

  path:any = [];
  titulo:any = {icono: "",nombre:""}

  lstUsuarios: Array<any> = [];
  lstServidores: Array<any> = [];
  lstServidoresAsignados: Array<any> = [];
  current_server_name:string ="";

  constructor(){
    effect(()=>{
      if (this.server()!==undefined){
        this.initial();
        this.work = this.server();
        this.openWS();
      }
    })
  }

  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get('user'));
    this.path = [
      {nombre: "Dashboards", ruta: ""},
      {nombre: "Dashboard Servidor", ruta: "admin/dashboard"},
    ];
    this.titulo = {icono: "fas fa-chart-bar",nombre: "Dashboard Servidor"}
    this.initial();
  }

  ngOnDestroy(): void {
    console.log("Deteniendo Temporizador")
    clearInterval(this.tmrMonitor)
    this.ws.close(1000);
    this.ws = null
  }

  initial(){
    this.work = {
      host:"",
      ssh_puerto: 0,
      agente_puerto:0,
    }

    this.lstDatos = {
      uptime: "00:00",
      hora: "",
      tasks:{
        total: 0,
        running: 0,
        sleeping: 0,
        stopped: 0,
        zombie: 0,
      },
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
      ip: "",
      release: null,
      servicios: [],
      infocpu: null,
      procesos: [],
      puertos: [],
      red: []
    }

    this.dataset1.push({
      data: [],
      label: "CPU%",
      fill: true,
      tension: 0.1,
      borderColor: 'rgba(6, 147, 241, 0.4)',
      borderWidth: 3,
      backgroundColor: 'rgba(6, 147, 241, 0.2)'
    });

    this.dataset2.push({
        data: [],
        label: "RX",
        fill: true,
        tension: 0.1,
        borderColor: 'rgba(252, 152, 1, 0.69)',
        borderWidth: 2,
        backgroundColor: 'rgba(252, 235, 1, 0.05)'
      },
      {
        data: [],
        label: "TX",
        fill: true,
        tension: 0.1,
        borderColor: 'rgba(19, 97, 170, 1)',
        borderWidth: 2,
        // backgroundColor: 'rgba(7, 130, 245, 1)'
        backgroundColor: 'rgba(7, 130, 245, 0.07)'
      }
    );
  }

  graphCPU(m1:any="0", m5:any="0", m15:any="0"){
    // let dataset:any = [];
    this.labelsCpu.splice(0,1);
    this.labelsCpu.push(moment().format("HH:mm:ss"))
    let labels:any = this.labelsCpu;
    m1 = parseFloat(m1);
    m5 = parseFloat(m5);
    m15 = parseFloat(m15);

    this.lstCpuData1.splice(0,1);
    this.lstCpuData1.push(m1);

    this.dataset1[0].data =  this.lstCpuData1;
    this.cpuChartData  = {
      labels: labels,
      datasets: this.dataset1
    }
  }


  graphProcesos(){
    // let cpu = 0;
    // let mem = 0;

    // this.labelsPro.splice(0,1);
    // this.labelsPro.push(moment().format("HH:mm:ss"))
    // let labels:any = this.labelsPro;

    // this.lstDatos.procesos.forEach((p:any)=>{
    //   cpu += p.CPU;
    //   mem += p.MEM;
    // })

    // this.lstProData1.splice(0,1);
    // this.lstProData1.push(cpu);

    // this.lstProData2.splice(0,1);
    // this.lstProData2.push(mem);

    // this.dataset2[0].data =  this.lstProData1;
    // this.dataset2[1].data =  this.lstProData2;
    // this.proChartData  = {
    //   labels: labels,
    //   datasets: this.dataset2
    // }
  }


  graphRed(rx:any, tx:any){

    this.labelsPro.splice(0,1);
    this.labelsPro.push(moment().format("HH:mm:ss"))
    let labels:any = this.labelsPro;

    this.lstProData1.splice(0,1);
    this.lstProData1.push(rx);

    this.lstProData2.splice(0,1);
    this.lstProData2.push(tx);

    this.dataset2[0].data =  this.lstProData1;
    this.dataset2[1].data =  this.lstProData2;
    this.proChartData  = {
      labels: labels,
      datasets: this.dataset2
    }
  }

  startMonitor(){
    this.playMonitor = true;
    this.onSendCommands();
    this.tmrMonitor = setInterval(() => {
      this.onSendCommands();
    }, this.tiempo_refresco * 1000);
  }

  stopMonitor(){
    console.log("Deteniendo")
    this.agente_status = "Deteniendo ...";
    this.playMonitor = false;
    this.lstDatos.procesos = [];
    this.initial();
    clearInterval(this.tmrMonitor);
    this.ws.close(1000)
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
    let status = '';
    if (event.type == 'open') {
      console.log(`√ Conectado ${this.work.idservidor}`);
      this.agente_status = "Conectado";
      this.work.healthy_agente = 'OK|Conectado';
      this.playMonitor=true;
      this.startMonitor();
    } else {
      
      this.agente_status = "No se estableció conexion con Sentinel";
      this.func.closeSwal()
      console.log(`X Desconectado ${this.work.idservidor}`);
      this.work.agente_status = 'FAIL|Desconectado';
      // this.initial();
      // setTimeout(()=>{
      //   console.log("Reintentando conexion")
      //   this.initial();
      // },10000)
    }
  }

  onCloseListener(event: any) {
    this.func.closeSwal()
    console.log(`X Desconectado ${this.work.idservidor}`);
    if (event.code == 1000){
      this.agente_status = "Desconectado manualmente";
      this.ws_error = 0;
    }else{
      this.stopMonitor();
      this.func.showMessage("error", "Dashboard", "Servidor Desconectado");
      this.work.healthy_agente = 'FAIL|Desconectado';
      this.agente_status = "Desconectado";
      this.loading = false;
      this.playMonitor=false;
      // if (this.reconnect && this.ws_error < this.ws_error_limit){
      //   this.ws_error ++;
      //   setTimeout(()=>{
      //     this.initial();
      //   },1000)
      // }
    }
  }

  onErrorListener(event: any) {}

  onMessageListener(e: any) {
    console.log(`√ LlegoMensaje ${this.work.idservidor}`);
    let data = JSON.parse(e.data);
    // console.log(data)
    let r = "";
    let acum:any = [];
    let rd:any = [];
    let aux:any | undefined;
    let drep:any;
    let daux:any;
    data.data.forEach((d:any)=>{
      d.respuesta= atob(d.respuesta);
      switch(d.id){
        case "top":
          this.lstDatos.procesos = [];
          let datatop = d.respuesta.split("\n");
          datatop.forEach((dt:any, idx:any)=>{
            switch(idx){
              case 0: //top
                drep = dt.replace(/,/g,"");
                daux = drep.replace(/-/g,"").split(" ");
                // console.log(daux)
                this.lstDatos.hora = daux[2]; //hora
                this.lstDatos.uptime = daux[4]+ " " + daux[5]; //uptime
                let t1;
                let t5;
                let t15;
                if (daux[10].indexOf("average")>-1){
                  t1 =  daux[11];
                  t5 =  daux[12];
                  t15 =  daux[13];
                }else if (daux[11].indexOf("average")>-1){
                  t1 =  daux[12];
                  t5 =  daux[13];
                  t15 =  daux[14];
                }
                this.lstDatos.cpu.t1 = t1;
                this.lstDatos.cpu.t5 = t5;
                this.lstDatos.cpu.t15 = t15;
                // this.graphCPU(t1, t5, t15);
                break;
              case 1: // Tasks
                let txt = "";
                dt.split("").forEach((e:any) => {
                  if (["1","2","3","4","5","6","7","8","9","0",","].includes(e)){
                    txt += e;
                  }
                });
                drep = txt.split(",")
                this.lstDatos.tasks.total = drep[0];
                this.lstDatos.tasks.running = drep[1];
                this.lstDatos.tasks.sleeping = drep[2];
                this.lstDatos.tasks.stopped = drep[3];
                this.lstDatos.tasks.zombie = drep[4];
                // console.log(this.lstDatos.tasks)
                break;
              case 2: // %CPU
                daux = dt.split(",")[3].replace(" id", "");
                let v = 100 - parseFloat(daux);
                this.lstDatos.cpu.porcentaje = this.func.numberFormat(v,2);
                this.graphCPU(v, 0, 0);
                break;
              case 3: //MIB MEM
                 daux = dt.replace("MiB Mem :  ", "");
                 daux = daux.replace("total", "");
                 daux = daux.replace("free", "");
                 daux = daux.replace("used", "");
                 daux = daux.replace("buff/cache", "");
                 daux = daux.replace(/\ /g, "");
                 drep = daux.split(",");
                 this.lstDatos.memoria.total = drep[0];
                 this.lstDatos.memoria.usado = drep[2];
                 this.lstDatos.memoria.libre = drep[1];
                 this.lstDatos.memoria.porcentaje = this.func.numberFormat( (   (parseFloat(drep[2]) / parseFloat(drep[0]))*100  ),2);
                //  console.log(drep);
                break;
              case 4: // Swap
                break;
              case 5: //vacio
                break;
              case 6: //Tituloprocesos
                break;
              default: //Procesos
                daux = dt.split(" ");
                drep = [];
                daux.forEach((d:any)=>{
                  if (d.trim() != ""){
                    drep.push(d)
                  }
                })
                if (drep.length>0){
                  let command = drep.slice(11, 20).join(" ");
                  this.lstDatos.procesos.push({
                    "PID" : drep[0],
                    "USER" : drep[1],
                    "PR" : drep[2],
                    "NI" : drep[3],
                    "VIRT" : drep[4],
                    "RES" : drep[5],
                    "SHR" : drep[6],
                    "S" : drep[7],
                    "CPU" : parseFloat(drep[8]),
                    "MEM" : parseFloat(drep[9]),
                    "TIME" : drep[10],
                    "COMMAND" : command
                  })
                  
                }
                break;

            }
          })
          // this.graphProcesos();
          break;
        case "disco":
          let res:any = d.respuesta.split("\n")
          let fila1 = res[0].split(" ");
          this.lstDatos.disco.total = fila1[0];
          this.lstDatos.disco.usado = fila1[1];
          this.lstDatos.disco.libre = fila1[2];
          this.lstDatos.disco.porcentaje = fila1[3].replace("\n", "").replace("%", "");
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
          // console.log(this.lstDatos)
          this.graphCPU(r[0], r[1], r[2]);
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
          // console.log(this.lstDatos.release)
          break;
        case "infocpu":
          aux = d.respuesta.split("\n");
          acum = [];
          aux.forEach((rs:any)=>{
            if (rs != ""){
              let rss = rs.replace(/\t/g,"");
              rss = rss.replace(/"/g,"");
              rss = rss.split(":");
              acum.push(rss)
            }
          })
          this.lstDatos.infocpu = acum;
          break;
        case "puertos":
          aux = d.respuesta.split("\n");
          acum = [];
          let row:any = [];
          aux.forEach((rs:any)=>{
            // console.log(rs)
            if (rs != ""){
              let rss = rs.replace("::","");
              rss = rss.replace(":",",");
              rss = rss.split(",");
              let found =false;
              acum.forEach((a:any)=>{
                if (a==rss[5]){
                  found =true;
                }
              })
              if (!found) acum.push(rss[5])
            }
          })
          this.lstDatos.puertos = acum;
          break;
        case "servicios":
          rd = (d.respuesta.split("\n"));
          acum = [];
          rd.forEach((rs:any)=>{
            if (rs.substring(0,1)!="●"){
              let rss = rs.split(",");
              if (rss[0]!="") acum.push(rss)
            }
          })
          this.lstDatos.servicios = acum;
          break;
        case "procesos":
          rd = (d.respuesta.split("\n"));
          acum = [];
          rd.forEach((rs:any)=>{
            let rss = rs.split(",");
            if (rss[0]!="" && rss[0]!="PID") acum.push({
              "PID" : rss[0],
              "USER" : rss[1],
              "PR" : rss[2],
              "NI" : rss[3],
              "VIRT" : rss[4],
              "RES" : rss[5],
              "SHR" : rss[6],
              "S" : rss[7],
              "CPU" : parseFloat(rss[8]),
              "MEM" : parseFloat(rss[9]),
              "TIME" : rss[10],
              "COMMAND" : rss[11],
            })
          })
        // console.log(acum)
          this.lstDatos.procesos = acum;
          // this.refreshAllProc();
          break;
        case "ip":
          daux = d.respuesta.split("\n");
          drep = daux[1].split(",")[8];
          this.lstDatos.ip = drep;
          break;
        case "red":
          //Iface MTU RX-OK RX-ERR  RX-DRP  RX-OVR  TX-OK TX-ERR  TX-DRP  TX-OVR  Flg
          daux = d.respuesta.split("\n");
          drep = daux[2].split(",");
          this.graphRed(drep[2], drep[6]);
          break;
      }
      
    });
  }

  onSendCommands(){
    let params = {
      action: "comando",
      identificador: {
        idcliente: this.user.idcliente,
        idusuario: this.user.idusuario,
        idservidor: this.work.idservidor,
        usuario: this.user.usuario,
        id: Math.floor(Math.random() * (9999999999999999 - 1000000000000000 + 1)) + 1000000000000000
      },
      data: [
        {"id": "top", "cmd":"top -b -n1 -em -o %MEM"},
        {"id": "disco", "cmd":" df -hT | grep -E 'ext4|xfs|btrfs' | awk '{print $3, $4, $5, $6}'"},
        {"id": "ip", "cmd":`ip route | column -t | awk '{print $1","$2","$3","$4","$5","$6","$7","$8","$9}'`},
        {"id": "release", "cmd":`cat /etc/os-release`},
        {"id": "infocpu", "cmd":`cat /proc/cpuinfo`},
        // {"id": "infocpu", "cmd":`lscpu`},
        {"id": "puertos", "cmd":`ss -tuln | grep LISTEN | head -10 | awk '{print $1","$2","$3","$4","$5","$6}'`},
        {"id": "red", "cmd":`netstat -i | column -t | awk '{print $1","$2","$3","$4","$5","$6","$7","$8","$9","$10","$11}'`},
      ]

    };
    if (this.connState()){
      console.log("↑ Enviando")
      this.ws.send(JSON.stringify(params));
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
}
