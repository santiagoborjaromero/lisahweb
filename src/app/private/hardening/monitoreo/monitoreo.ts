import { Component, inject, Sanitizer } from '@angular/core';
import { Breadcrums } from '../../shared/breadcrums/breadcrums';
import { Header } from '../../shared/header/header';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Functions } from '../../../core/helpers/functions.helper';
import { Sessions } from '../../../core/helpers/session.helper';
import moment from 'moment';
import { DomSanitizer } from '@angular/platform-browser';
import { ScriptsService } from '../../../core/services/script.service';
import { AllCommunityModule, createGrid, GridApi, GridOptions, ICellRendererParams, ModuleRegistry } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-monitoreo',
  imports: [Breadcrums, Header, CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './monitoreo.html',
  styleUrl: './monitoreo.scss'
})
export class Monitoreo {
  private readonly func = inject(Functions);
    private readonly sessions = inject(Sessions);
    private readonly sanitizer = inject(DomSanitizer);
    private readonly scriptSvc = inject(ScriptsService);
  
    user: any = null;
    work: any = null;
    canR: boolean = true;
    canW: boolean = true;
    canD: boolean = true;
    
    public dtOptions: any = {};
    public gridOptions: GridOptions<any> = {};
    public gridApi?: GridApi<any>;
    public id_selected: string = '';
    public is_deleted: any = null;
  
    wsConn:any;
  
    rstServidor:any | undefined;
    lstServidor:any | undefined;
    
    loadMonitoreo: boolean = false;
    logs:string = "";
    lstLogs:any = [];
    logHtml:any;
    camposMonitoreo: any = [];
    
    lstMonitoreo: any = [];
    puedeVerMonitoreo: boolean = false;
  
    lstConfig: any = {};
    tiempo_refresco : number = 0;
  
    tmrMonitoreo: any | undefined;
    playMonitor: boolean = false;
  
    idservidor: any;
  
    ngOnInit(): void {
      this.user = JSON.parse(this.sessions.get('user'));
      this.work = JSON.parse(this.sessions.get('work'));
  
      // console.log(this.user)
      
      this.lstConfig = this.user.config;
      this.tiempo_refresco = this.lstConfig.tiempo_refresco;
      
      if (this.user.idrol > 1) {
        let scope = this.user.roles.permisos_crud.split('');
        this.canR = scope[0] == 'R' ? true : false;
        this.canW = scope[1] == 'W' ? true : false;
        this.canD = scope[2] == 'D' ? true : false;
  
        if (!this.canR) {
          this.func.showMessage(
            'info',
            'Usuarios',
            'No tiene permisos para leer'
          );
        }
      }
      
      this.rstServidor = {};
      this.lstServidor = [];
  
  
      this.work.servidores.forEach((s:any) => {
        
        this.lstServidor.push(s);
  
        if (this.work.monitor){
          if (s.idscript_monitoreo){
            this.lstMonitoreo.push({
              idservidor: s.idservidor,
              nombre: s.nombre,
            })
            this.log("INFO", `Servidor ${s.nombre} activado monitoreo.`)
          }else{
            this.log("ERROR", `Servidor ${s.nombre} no puede ser monitoreado porque no tiene script asignado.`)
          }
        }
      });
  
      if (this.lstServidor.length>0){
        this.idservidor = this.lstServidor[0].idservidor;
        this.rstServidor = this.lstServidor[0];
      }
    }
  
    ngAfterViewInit(): void {
      this.initial();
    }
  
    changeServerDropDown(event:any){
      this.stopMonitor();
      this.lstServidor.forEach((e:any) => {
        if(e.idservidor == this.idservidor){
          this.rstServidor = e;
        }
      });
      this.initial();
    }
  
    initial(){
      
      if (this.work.monitor && this.rstServidor.idscript_monitoreo>0){
        this.puedeVerMonitoreo = true;
        this.getMonitoreo();
        setTimeout(()=>{
          this.dataGridStruct();
        },800);
        setTimeout(()=>{
          this.sendMonitor();
        },1000);
      }else{
        this.puedeVerMonitoreo = false;
      }
  
  
    }
  
    startMonitor(){
      if (this.tiempo_refresco>0){
        this.tmrMonitoreo = setInterval(()=>{
          this.sendMonitor();
        },this.tiempo_refresco * 1000);
        this.playMonitor=true;
      }
    }
  
    stopMonitor(){
      clearInterval(this.tmrMonitoreo);
      this.playMonitor=false;
    }
  
    sendMonitor = () => {
      // console.log("Enviando Monitor");
      let textSend = "";
      let compendio:any = [];
      this.lstMonitoreo[0].agente = 1;
      this.rstServidor.servicios.forEach((s:any, idx:any)=>{
        compendio.push({
          id: s.idtemplate_comando,
          cmd: s.cmd
        })
      });
      this.onSend({
        action: "comando",
        identificador: "servicios-3hhsy3788sjakjaksend",
        data: compendio
      });
      this.refreshAll();
    }
    
    onSend(textSend:any){
      if (!this.wsConn){
        this.connectWS();
      }else{
        console.log("Envio", textSend)
        !this.wsConn.send(JSON.stringify(textSend))
      }
    }
  
    log(type = "ERROR", text:string = ""){
      // let html =`<span class="${type =='ERROR' ? 'text-danger': 'text-primary'}"><strong>${moment().format("HH:MM:SS")}</strong> ${text}</span><br>`;
      let txt = `${moment().format("HH:mm:ss")} ${text}`;
  
      if (type.toLowerCase()=="error"){
        if (this.lstLogs.length > 9){
          this.lstLogs.splice(9,1);
        }
        this.lstLogs.splice(0, 0, txt);
      }else{
        console.log(txt)
      }
    }
  
    borrarLog(index:number){
      this.lstLogs.splice(index,1);
    }
  
    funcCancelar(){
      this.func.goRoute(`admin/hardening`, false,true);
    }
  
    getMonitoreo(){
      this.camposMonitoreo = [
        {
          headerName: 'ID',
          field: 'idservidor',
          filter: false,
          hide: true,
        },
        {
          headerName: 'Nombre Servidor',
          field: 'nombre',
          cellClass: 'text-start',
          filter: false,
          flex:2,
          pinned: "left"
        },
      ];
      let servicios:any = [];
      this.scriptSvc.getOne(this.rstServidor.idscript_monitoreo).subscribe({
        next: (resp: any) => {
          if (resp.status) {
            this.camposMonitoreo.push(
              {
                headerName: 'Agente',
                field: 'agente',
                cellClass: 'text-start',
                filter: false,
                cellRenderer: (params: ICellRendererParams) => {
                  let data = params.data;
                  let dato = data.agente;
                  let text = 'Cargando';
                  let icono = 'fas fa-spinner fa-spin';
                  let color = 'text-secondary';
                  if (dato == 1) {
                    icono = 'far fa-check-circle t20';
                    text = 'Conectado';
                    color = 'text-success';
                  }
                  return `<span class="${color}"><i class='${icono}'></i> ${text}</span>`;
                },
              }
            );
            this.lstMonitoreo[0]["agente"] = "";
  
            resp.data[0].cmds.forEach((el:any) => {
              el.respuesta = ""
              servicios.push({
                idtemplate_comando: el.idtemplate_comando,
                alias: el.alias != "" ? el.alias : el.cmd,
                cmd: el.linea_comando,
                respuesta: ""
              });
              this.camposMonitoreo.push(
                {
                  headerName: el.alias != "" ? el.alias : el.cmd,
                  field: "t" + el.idtemplate_comando,
                  cellClass: 'text-start',
                  filter: false,
                  cellRenderer: (params: ICellRendererParams) => {
                    let dato = params.value;
                    let text = 'Cargando';
                    let icono = 'fas fa-spinner fa-spin';
                    let color = 'text-secondary';
                    if (dato != "") {
                      // icono = 'far fa-check-circle t20';
                      icono = '';
                      text = dato;
                      color = '';
                    }
                    return `<span class="${color}"><i class='${icono}'></i> ${text}</span>`;
                  },
                  
                }
              );
              this.lstMonitoreo[0]["t" + el.idtemplate_comando] = "";
            });
            
          } else {
          }
        },
        error: (err: any) => {
        },
      });
      this.rstServidor["servicios"] = servicios;
    }
  
  dataGridStruct() {
      // console.log(this.lstMonitoreo)
      let that = this;
      this.gridOptions = {
        rowData: [],
        pagination: false,
        paginationPageSize: 1,
        paginationPageSizeSelector: [5, 10, 50, 100, 200, 300, 1000],
        rowHeight: 40,
        tooltipInteraction: true, 
        deltaSort: true, 
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
          this.id_selected = event.data.idservidor;
          this.is_deleted = event.data.deleted_at;
        },
        columnDefs: this.camposMonitoreo,
      };
  
      that.gridApi = createGrid(
        document.querySelector<HTMLElement>('#myMonitor')!,
        this.gridOptions
      );
  
      this.refreshAll();
      this.connectWS();
    }
  
    refreshAll() {
      var params = {
        force: true,
        suppressFlash: true,
      };
      this.gridApi!.refreshCells(params);
      this.gridApi!.setGridOption('rowData', this.lstMonitoreo);
      this.gridOptions.autoSizeStrategy;
    }
  
    async connectWS(){
      if (!this.wsConn){
        console.log("Conectando ....")
        let ws = `ws://${this.rstServidor.host}:${this.rstServidor.agente_puerto}`;
        this.wsConn = new WebSocket(ws);
        this.wsConn.onopen = (event:any) => this.onOpenListener(this.wsConn, event);
        this.wsConn.onmessage = (event:any) => this.onMessageListener(this.wsConn, event);
      }else{
        console.log("ya esta conectado");
      }
    } 
  
    onOpenListener(socket:any, event:any){
      console.log("[√] Conectado")
      this.sendMonitor();
    }
  
    onMessageListener(socket:any, event:any){
      console.log("█ Entrada ", event.data)
  
      let data = JSON.parse(event.data);
      let referencia = data.identificador.split("-")[0];
      let identificador = data.identificador.split("-")[2];
      
      switch(referencia){
        case "servicios":
          // this.encontrarRow(data.data)
          data.data.forEach((r:any)=>{
            console.log(r)
            this.lstMonitoreo[0][`t${r.id}`] = r.respuesta;
          });
          console.log(this.lstMonitoreo)
          this.refreshAll();  
          this.loadMonitoreo = true;
          setTimeout(()=>{
            this.loadMonitoreo = false;
          },300)
          break;
      }
    }
  
    funcNoti(){
      let html = `<ul readonly class="list-group h300" >`;
      if (this.lstLogs.length>0){
        this.lstLogs.forEach((e:any, idx:number)=>{
          html += `<li class="list-group-item t14 text-start d-flex">
          ${e}<br>
          <button onClick='borrarLog(${idx})' class="btn btn-link btn-sm text-danger"><i class="far fa-trash-alt"></i></button>
          </li>`;
        })
      }else{
        html += `<li class="list-group-item">No hay ningún error registrado</li>`;
      }
      html += `</ul>`
      this.func.showMessage("ingo", "Logs Error", html);
    }
  
  
  }
  