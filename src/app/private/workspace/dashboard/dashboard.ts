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
import { ChartConfiguration, ChartOptions, Chart, registerables } from "chart.js";
import { BaseChartDirective } from 'ng2-charts';
import { color } from 'chart.js/helpers';
import { AllCommunityModule, createGrid, GridApi, GridOptions, ModuleRegistry } from 'ag-grid-community';

Chart.register(...registerables);
ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, BaseChartDirective],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  standalone: true
})
export class Dashboard {
  private readonly route = inject(ActivatedRoute);
  private readonly sessions = inject(Sessions);
  private readonly func = inject(Functions);
  private readonly serverSvc = inject(ServidorService);
  private readonly agente = inject(WSService);
  private readonly parent = inject(Workspace);

  Title = "Dashboard";
  TAB = "dashboard"

  user:any | undefined;
  work:any | undefined;
  icono = iconsData;
  global = Global;

  loading:boolean = false;
  playMonitor:boolean = false;

  public dtOptions: any = {};
  public gridOptions: GridOptions<any> = {};
  public gridApi?: GridApi<any>;
  public id_selected: string = '';
  public is_deleted: any = null;
  public name_selected: string = '';
  public rows_selected: any = 0;
  public server_selected: any = {};

  lstServicios: Array<any> = [];
  lstRecursos: any = {};
  lstDatos:any = [];
  tmrMonitor:any = null;
  tiempo_refresco:number = 0;

  chartLegend:boolean = false;

  dataset1:any = [];

  lstCpuData1:any = [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  lstCpuData5:any = [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  lstCpuData15:any = [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

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
        text: `Rendimiento CPU (Minuto 1)`
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
  }

  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get("user"));
    this.work = JSON.parse(this.sessions.get("work"));

    this.tiempo_refresco = this.user.config.tiempo_refresco;

    this.initial();
    this.dataGridStruct();
    this.startMonitor();
  }

  ngOnDestroy(): void {
    clearInterval(this.tmrMonitor);
  }

  initial(){
    this.lstDatos = {
      uptime: "0d 00:00:00",
      agente_status: "",
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
      procesos: []
    }

    this.dataset1.push({
      data: [],
      label: "minuto 1",
      fill: true,
      tension: 0.1,
      borderColor: 'black',
      borderWidth: 0,
      backgroundColor: 'rgba(41, 219, 204, 0.79)'
    });
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
      },
    })
  }

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
        // {"id": "release", "cmd":"cat /etc/os-release"},
        // {"id": "servicios", "cmd":`systemctl list-units --type=service --all --no-legend | awk '{print $1","$2","$3","$4,","$5,","$6","$7","$8","$9}'`},
        // {"id": "infocpu", "cmd":"cat /proc/cpuinfo"},
        // {"id": "procesos", "cmd":`top -em -b -n1 | grep -E "^( *PID| *[0-9]+)" | sed 's/  */ /g' | sed 's/^ *//' | tr ' ' ',' | sed 's/^,*//' | sed 's/,$//'`},
        // {"id": "procesos", "cmd":`top -b -n1 -em | grep -E "^( *PID| *[0-9]+)" | sed 's/  */ /g' | sed 's/^ *//' | sort -t' ' -k5 -nr | head -n10 | tr ' ' ',' | sed 's/^,*//' | sed 's/,$//'`},
        {"id": "procesos", "cmd":`top -b -n1 -em | grep -E "^( *PID| *[0-9]+)" | sed 's/  */ /g' | sed 's/^ *//' | sort -t' ' -k5 -nr | tr ' ' ',' | sed 's/^,*//' | sed 's/,$//'`},
      ]
    };

    this.agente.sendCommand(this.work.idservidor, params)
    .then(resp=>{
      console.log("<INC>", resp)
      if (resp){
        let data = resp.data.data;
        let r = "";
        let acum:any = [];
        let rd:any = [];
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
                  "%CPU" : parseFloat(rss[8]),
                  "%MEM" : parseFloat(rss[9]),
                  "TIME+" : rss[10],
                  "COMMAND" : rss[11],
                })
              })
            // console.log(acum)
              this.lstDatos.procesos = acum;
              this.refreshAll()
              break;
          }
        })
      }
      this.loading = false;
    })
    .catch(err=>{

    })
  }

  go(ruta=""){
    this.parent.tabactive = ruta;
    this.func.irRuta(`admin/hardening/workspace/${ruta}`);
  }

  startMonitor(){
    this.playMonitor = true;
    this.openConn();

    this.tmrMonitor = setInterval(() => {
      this.openConn();
    }, this.tiempo_refresco *1000);
  }
  stopMonitor(){
    this.playMonitor = false;
    clearInterval(this.tmrMonitor);
  }


  graphCPU(m1:any="0", m5:any="0", m15:any="0"){
    // let dataset:any = [];
    let labels:any =  ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20"];
    m1 = parseFloat(m1);
    m5 = parseFloat(m5);
    m15 = parseFloat(m15);

    this.lstCpuData1.splice(0,1);
    this.lstCpuData1.push(m1);

    this.dataset1[0].data =  this.lstCpuData1;
    // dataset.push({
    //   data: this.lstCpuData5,
    //   label: "m5",
    //   fill: true,
    //   tension: 0.1,
    //   borderColor: 'black',
    //   borderWidth: 0,
    //   backgroundColor: 'rgba(42, 172, 189, 0.5)'
    // });
    // dataset.push({
    //   data: this.lstCpuData15,
    //   label: "m15",
    //   fill: true,
    //   tension: 0.1,
    //   borderColor: 'black',
    //   borderWidth: 0,
    //   backgroundColor: 'rgba(162, 189, 42, 0.5)'
    // });
    // })

    this.cpuChartData  = {
      labels: labels,
      datasets: this.dataset1
    }
    
    console.log(this.cpuChartData)

  }


  dataGridStruct() {
      let that = this;
      this.gridOptions = {
        rowData: [],
        pagination: true,
        paginationPageSize: 5,
        paginationPageSizeSelector: [5, 10, 50, 100, 200, 300, 1000],
        // rowSelection: 'single',
        rowHeight: 40,
        defaultColDef: {
          flex: 1,
          minWidth: 50,
          filter: false,
          headerClass: 'bold',
          floatingFilter: false,
          resizable: false,
          sortable: false,
          wrapText: true,
          wrapHeaderText: true,
          suppressAutoSize: true,
          autoHeaderHeight: true,
          suppressSizeToFit: true,
        },
        onRowClicked: (event: any) => {
          this.id_selected = event.data.PID;
        },
        columnDefs: [
          {
            headerName: 'PID',
            headerClass: ["th-center", "th-normal"],
            field: 'PID',
            filter: false,
          },
          {
            headerName: 'USER',
            headerClass: ["th-center", "th-normal"],
            field: 'USER',
            cellClass: 'text-start',
            filter: true,
          },
          {
            headerName: 'PR',
            headerClass: ["th-center", "th-normal"],
            field: 'PR',
            cellClass: 'text-start',
            filter: true,
          },
          {
            headerName: 'NI',
            headerClass: ["th-center", "th-normal"],
            field: 'NI',
            cellClass: 'text-start',
            filter: true,
          },
          {
            headerName: 'VIRT',
            headerClass: ["th-center", "th-normal"],
            field: 'VIRT',
            cellClass: 'text-start',
            filter: true,
          },
          {
            headerName: 'RES',
            headerClass: ["th-center", "th-normal"],
            field: 'RES',
            cellClass: 'text-start',
            filter: true,
          },
          {
            headerName: 'SHR',
            headerClass: ["th-center", "th-normal"],
            field: 'SHR',
            cellClass: 'text-start',
            filter: true,
          },
          {
            headerName: 'S',
            headerClass: ["th-center", "th-normal"],
            field: 'S',
            cellClass: 'text-start',
            filter: true,
          },
          {
            headerName: '%CPU',
            headerClass: ["th-center", "th-normal"],
            field: '%CPU',
            cellClass: 'text-start',
            filter: true,
            sortable: true
          },
          {
            headerName: '%MEM',
            headerClass: ["th-center", "th-normal"],
            field: '%MEM',
            cellClass: 'text-start',
            filter: true,
            sortable: true
          },
          {
            headerName: 'TIME+',
            headerClass: ["th-center", "th-normal"],
            field: 'TIME+',
            cellClass: 'text-start',
            filter: true,
            sortable: true
          },
          {
            headerName: 'COMMAND',
            headerClass: ["th-center", "th-normal"],
            field: 'COMMAND',
            cellClass: 'text-start',
            filter: true,
          },
        ],
      };
  
      that.gridApi = createGrid(
        document.querySelector<HTMLElement>('#myGrid')!,
        this.gridOptions
      );
    }
  
    refreshAll() {
      var params = {
        force: true,
        suppressFlash: true,
      };
      this.gridApi!.refreshCells(params);
      this.gridApi!.setGridOption('rowData', this.lstDatos.procesos);
    }

}
