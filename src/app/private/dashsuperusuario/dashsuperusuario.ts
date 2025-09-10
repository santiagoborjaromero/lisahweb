import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, inject, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Sessions } from '../../core/helpers/session.helper';
import { Path } from '../shared/path/path';
import { Titulo } from '../shared/titulo/titulo';
import { Functions } from '../../core/helpers/functions.helper';
import { GeneralService } from '../../core/services/general.service';
import { Chart, ChartConfiguration, ChartOptions, Colors, registerables} from 'chart.js';
import iconsData from '../../core/data/icons.data';
import { Global } from '../../core/config/global.config';
import { AllCommunityModule, createGrid, GridApi, GridOptions, ICellRendererParams, ModuleRegistry, } from 'ag-grid-community';
import { BaseChartDirective } from 'ng2-charts';
import moment from 'moment';

Chart.register(...registerables, Colors);
ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-dashsuperusuario',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, Titulo, Path, BaseChartDirective],
  templateUrl: './dashsuperusuario.html',
  styleUrl: './dashsuperusuario.scss'
})
export class Dashsuperusuario {
  @ViewChild('btnClose') btnClose: any;
  private readonly sessions = inject(Sessions);
  private readonly func = inject(Functions);
  private readonly generalSvc = inject(GeneralService);

  user: any | undefined;
  work: any = {
    host: '',
    ssh_puerto: 0,
    agente_puerto: 0,
  };
  icono = iconsData;
  global = Global;

  loading: boolean = false;
  playMonitor: boolean = false;

  colores: any = [];

  lstData: any;
  index: any = -1;

  public dtOptions: any = {};
  public gridOptions: GridOptions<any> = {};
  public gridApi?: GridApi<any>;
  public id_selected: string = '';
  public is_deleted: any = null;
  public name_selected: string = '';
  public rows_selected: any = 0;
  public server_selected: any = {};

  rstServidor: any = { usuarios: [] };

  lstCfg: any;
  lstAcciones: Array<any> = [];
  lstUltimasAcciones: Array<any> = [];
  lstServicios: Array<any> = [];
  lstRecursos: any = {};
  lstDatos: any = [];
  tmrMonitor: any = null;
  tiempo_refresco: number = 10;
  paginacion = 50;

  chartLegend: boolean = false;
  idservidor: any;

  dataset1: any = [];
  dataset2: any = [];
  dataset3: any = [];

  agente_status: string = 'Desconectado';
  

  lstPorMetodo: any = [];
  lstPorDescripcion: any = [];

  totalSentinel = 0;
  totalBase = 0;

  idusuario: any = 0;

  /**
   * Sentinel
   */
  ws: any;
  reconnect: boolean = true;
  light_ws: boolean = false;
  ws_error: number = 0;
  ws_error_limit: number = 3;

  public polarChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [],
  }

  public polarChartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      // colors: {
      //   // forceOverride: true
      // },
      legend: {
        display: false,
        position: 'bottom',
        align: "start",
        labels: {
          color: 'rgb(0, 0, 0)'
        }
      },
      title: {
        display: false,
        text: 'Gráfico de operaciones por servidor por Sentinel'
      }
    }
  };

  public metodosChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [],
  }

  public metodosChartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      // colors: {
      //   // forceOverride: true
      // },
      legend: {
        position: 'top',
        align: "center"
      },
      title: {
        display: false,
        text: 'Total de operaciones por método'
      }
    }
  };

  public descripcionChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [],
  }

  public descripcionChartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      // colors: {
      //   forceOverride: false,
      //   enabled: false
      // },
      legend: {
        position: 'right',
      },
      title: {
        display: false,
        text: 'Total de operaciones por descripcón'
      }
    }
  };

  path: any = [];
  titulo: any = { icono: '', nombre: '' };

  lstUsuarios: Array<any> = [];
  lstServidores: Array<any> = [];
  lstServidoresAsignados: Array<any> = [];
  current_server_name: string = '';

  constructor() {


  }

  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get('user'));
    this.path = [
      { nombre: 'Dashboards', ruta: '' },
      { nombre: 'Dashboard de Operaciones', ruta: 'admin/dashoperaciones' },
    ];
    this.titulo = {
      icono: 'fas fa-grip-vertical',
      nombre: 'Dashboard de Operaciones',
    };

    this.colores = this.func.colores();

    this.initial();
  }
  
  ngOnDestroy(): void {}
  
  initial() {
    this.rstServidor = null;
    this.lstCfg = null;
    this.lstAcciones = [];
    this.lstUltimasAcciones = [];
    this.lstUsuarios = [];
    this.lstServidores = [];
    this.lstServidoresAsignados = [];

    this.dataset1.push({
      data: [],
      // label: "Interacciones totales por server",
      fill: true,
      tension: 0.1,
      borderWidth: 0,
      backgroundColor: this.colores
    });
    this.dataset2.push({
      data: [],
      // label: "Interacciones totales por server",
      fill: true,
      tension: 0.1,
      borderWidth: 0,
      backgroundColor: this.colores
    });
    this.dataset3.push({
      data: [],
      label: "",
      fill: true,
      tension: 0.1,
      borderWidth: 0,
      backgroundColor: this.colores
    });

    if (this.user.grupo){
      this.idusuario = this.user.idusuario;
      this.getUsuario(); 
    }else{
      this.idusuario = 0;
      this.listaTodosServidores();
    }

    this.getAcciones();
    this.getUltimasAcciones();
  }

  // getServidor() {
  //   /**
  //    * Servidor y lista de usuarios asignados
  //    */
  //   this.func.showLoading('Cargando');
  //   this.generalSvc
  //     .apiRest('GET', `servidores_usuarios/${this.idservidor}`)
  //     .subscribe({
  //       next: (resp: any) => {
  //         this.func.closeSwal();
  //         // console.log("→", resp)
  //         if (resp.status) {
  //           this.rstServidor = resp.data[0];

  //           this.lstCfg = resp.data[0].cliente.configuracion;
  //           this.tiempo_refresco = this.lstCfg.tiempo_refresco;
  //         } else {
  //           this.func.handleErrors('Servidor', resp.message);
  //         }
  //       },
  //       error: (err: any) => {
  //         this.func.closeSwal();
  //         this.func.handleErrors('Servidor', err);
  //       },
  //     });
  // }

  getUsuario() {
    /**
     * Usuario y lista de servidores asignados
     */
    this.generalSvc
      .apiRest('GET', `usuarios/${this.idusuario}`)
      .subscribe({
        next: (resp: any) => {
          this.func.closeSwal();
          // console.log("█", resp)
          if (resp.status) {
            resp.data[0].servidores.forEach((e:any) => {
              if (e.estado == 1){
                this.lstServidoresAsignados.push(e);
              }
            });
            this.idservidor = this.lstServidoresAsignados[0].idservidor;
            this.openWS()
          } else {
            this.func.showMessage('error', 'Usuario', resp.message);
          }
        },
        error: (err: any) => {
          this.func.closeSwal();
          this.func.handleErrors('Usuario', err);
        },
      });
  }

  listaTodosServidores() {
    /**
     * lista de todos los servidores
     */    
    this.lstServidoresAsignados = [];
    this.func.showLoading('Cargando');
    this.generalSvc.apiRest("GET", `servidores`).subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        // console.log("→1←", resp)
        if (resp.status) {
          resp.data.forEach((e:any) => {
            if (e.estado == 1){
              this.lstServidoresAsignados.push(e);
            }
          });
          this.graphServerInteraccionCabecera();
          this.openWS();
        } else {
          this.func.handleErrors("Servidor", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
        this.func.handleErrors("Servidor", err);
      },
    });
  }

  getAcciones() {
    this.lstAcciones = [];
    this.generalSvc.apiRest('GET', `acciones_audit/${this.idusuario}`).subscribe({
        next: (resp: any) => {
          // console.log("↓sss", resp);
          this.func.closeSwal();
          if (resp.status) {
            this.lstAcciones = resp.data;
            
            this.lstPorMetodo = [];
            this.lstPorDescripcion = [];

            let found = false;
            this.lstAcciones.forEach((a:any, index:any)=>{

              this.totalBase += a.total;

              /**
               * Por Metodo
               **/
              found = false;
              this.lstPorMetodo.forEach( (m:any) => {
                if (a.metodo == m.metodo){
                  found = true;
                  m.valor += a.total;
                }
              });
              if (!found){
                this.lstPorMetodo.push({
                  metodo: a.metodo,
                  valor: a.total
                })
              }
              this.graphPorMetodo();

              /**
               * Por Descripcion
               **/
              found = false;
              this.lstPorDescripcion.forEach( (m:any) => {
                if (a.descripcion == m.descripcion){
                  found = true;
                  m.valor += a.total;
                }
              });
              if (!found){
                if (a.descripcion && a.descripcion != ""){
                  this.lstPorDescripcion.push({
                    orden: this.lstPorDescripcion.length + 1,
                    descripcion: a.descripcion,
                    valor: a.total
                  })
                }
              }
              this.graphPorDescripcion();


            })
          } else {
            this.func.showMessage('error', 'Usuario', resp.message);
          }
        },
        error: (err: any) => {
          this.func.closeSwal();
          this.func.handleErrors('Usuario', err);
        },
      });
  }

  // graph(){
  //   let labels:any = [];
  //   let conteo:any = [];
  //   let total:any = [];
  //   this.lstServidoresAsignados.forEach(e=>{
  //     labels.push(e.nombre);
  //     conteo.push(e.conteo)
  //     total.push(e.total);
  //   })
  //   this.polarChartData.labels = labels;
  //   this.polarChartData.datasets = [
  //       {
  //         label: 'Interacciones',
  //         data: conteo,
  //       },
  //       {
  //         label: 'Total',
  //         data: total,
  //       }
  //     ];
  // }

  getUltimasAcciones() {
    this.generalSvc
      .apiRest('GET', `ultimas_acciones_audit/${this.idusuario}`)
      .subscribe({
        next: (resp: any) => {
          // console.log("↓-", resp);
          this.func.closeSwal();
          if (resp.status) {
            resp.data.forEach((e: any) => {
              e['fecha'] = moment(e.created_at).format('YYYY-MM-DD HH:mm:ss');
              e['back'] = e.metodo == 'DELETE' ? 'bg-danger' : e.metodo == 'POST' ? 'bg-primary' : 'bg-warning';
              e['usuario'] = e.usuario ? e.usuario.nombre : '';
              this.lstUltimasAcciones.push(e);
            });
          } else {
            this.func.showMessage('error', 'Usuario', resp.message);
          }
        },
        error: (err: any) => {
          this.func.closeSwal();
          this.func.handleErrors('Usuario', err);
        },
      });
  }


  openWS() {
    this.index ++;
    if (this.index == this.lstServidoresAsignados.length){
      this.index = -1 ;
      console.log("Fin de lectura de servidores")
      return
    }

    this.id_selected = this.lstServidoresAsignados[this.index].idservidor;
    let host = this.lstServidoresAsignados[this.index].host;
    let agente_puerto = this.lstServidoresAsignados[this.index].agente_puerto;

    console.log(`Conectando ... ${host}:${agente_puerto}`);
    const token = this.sessions.get('token');
    let url = `ws://${host}:${agente_puerto}/ws?token=${token}`;
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
      console.log(`√ Conectado ${this.id_selected}`);
      this.agente_status = "Conectado";
      this.connState();
      this.onSendCommands();
    } else {
      // this.agente_status = "No se estableció conexion con Sentinel";
      // console.log(`X Desconectado ${this.id_selected}`);
    }
  }

  onCloseListener(event: any) {
    console.log(`X Desconectado ${this.id_selected}`);
    if (event.code == 1000){
      this.agente_status = "Desconectado manualmente";
      this.ws_error = 0;
    }else{
      // this.work.healthy_agente = 'FAIL|Desconectado';
      // this.agente_status = "Desconectado";
      // if (this.reconnect && this.ws_error < this.ws_error_limit){
      //   this.ws_error ++;
      // }
      this.buscarSevidor(this.id_selected, [0,0,0,0] );
      
    }
    this.openWS();
  }

  onErrorListener(event: any) {}

  onMessageListener(e:any){
    console.log(`↓ LlegoMensaje ${this.id_selected}`);
    let evento = JSON.parse(e.data);
    // console.log(evento)
    let data = [0,0,0,0];
    if (evento.data) {
      data = evento.data;
    } 
    let idservidor = evento.identificador.idservidor;
    this.buscarSevidor(idservidor, data)

    this.ws.close(1000);
    
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

  onSendCommands(){
    let params = {
      action: "statserver",
      identificador: {
        idcliente: this.user.idcliente,
        idusuario: this.user.idusuario,
        usuario: this.user.usuario,
        idservidor: this.id_selected,
        fecha: moment().format("YYYYMM"), 
        idusuario_filtro: this.idusuario,
        id: Math.floor(Math.random() * (9999999999999999 - 1000000000000000 + 1)) + 1000000000000000,
      },
      data: []
    };

    // console.log(params)
    
    if (this.connState()){
      console.log("↑ Enviando")
      this.ws.send(JSON.stringify(params));
    }
  }

  buscarSevidor(idservidor:any, data:any = [0,0,0,0] ){
    // console.log(idservidor, conteo, total, status="OK" );
    let valores:any =  this.dataset1[0].data; 

    this.totalSentinel += data[1];

    //[count, total, count_antes, total_antes]

    this.lstServidoresAsignados.forEach((s:any, idx:any) => {
      if (s.idservidor == idservidor){
        s.status = "OK";
        s.conteo_actual = data[0];
        s.total_actual = data[1];
        s.conteo_anterior = data[2];
        s.total_anterior = data[3];
        valores[idx] = data[1];
      }
    });

    // this.dataset1[0].data = valores;

    // this.polarChartData  = {
    //   datasets: this.dataset1
    // }
  }

  graphServerInteraccionCabecera(){
    let labels:any =  [];
    let valores:any =  [];

    this.lstServidoresAsignados.forEach((s:any) => {
      labels.push(s.nombre);
      valores.push(0);
    });

    this.polarChartData.labels =  labels;
    this.dataset1[0].data = valores;

    this.polarChartData  = {
      labels: labels,
      datasets: this.dataset1
    }
  }


  graphPorMetodo(){
    let labels:any =  [];
    let valores:any =  [];

    this.lstPorMetodo.forEach((s:any) => {
      labels.push(s.metodo);
      valores.push(s.valor);
    });

    this.dataset2[0].data = valores;

    this.metodosChartData  = {
      labels: labels,
      datasets: this.dataset2
    }
  }

  graphPorDescripcion(){
    let labels:any =  [];
    let valores:any =  [];

    let count = 0;

    this.lstPorDescripcion.forEach((s:any) => {
      count++;
      if (count<=5){
        labels.push(s.orden);
        valores.push(s.valor);
      }
    });


    this.dataset3.label = labels;
    this.dataset3[0].data = valores;

    this.descripcionChartData  = {
      labels: labels,
      datasets: this.dataset3
    }
  }



}
