import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Titulo } from '../shared/titulo/titulo';
import { Path } from '../shared/path/path';
import { Sessions } from '../../core/helpers/session.helper';
import moment from 'moment';
import { UsuarioService } from '../../core/services/usuarios.service';
import { Functions } from '../../core/helpers/functions.helper';
import { AllCommunityModule, createGrid, GridApi, GridOptions, ICellRendererParams, ModuleRegistry } from 'ag-grid-community';
import { GeneralService } from '../../core/services/general.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-audit',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, Titulo, Path],
  templateUrl: './audit.html',
  styleUrl: './audit.scss',
  standalone: true
})
export class Audit {
  private readonly sessions = inject(Sessions);
  private readonly userSvc = inject(UsuarioService);
  private readonly generalSvc = inject(GeneralService);
  private readonly func = inject(Functions);

  user:any = [];
  path:any = [];
  titulo:any = {icono: "",nombre:""}

  idusuario:string = "T";
  metodo:string = "T";
  lstUsuarios:any = [];
  lstData:any = [];
  fecha_desde:string = moment().format("YYYY-MM-DD");
  fecha_hasta:string = moment().format("YYYY-MM-DD");

  public dtOptions: any = {};
  public gridOptions: GridOptions<any> = {};
  public gridApi?: GridApi<any>;
  public id_selected: string = '';
  public is_deleted: any = null;

  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get('user'));
    this.path = [
      {nombre: "Admin & Hardening", ruta: ""}, 
      {nombre: "Auditoría Usuarios", ruta: "admin/audits"}, 
    ];
    this.titulo = {icono: "fas fa-user-secret",nombre: "Auditoría Usuarios"}
    this.dataGridStruct();
    this.getUsuarios();
  }

  getUsuarios() {
    this.lstUsuarios = [];
    this.generalSvc.apiRest("GET", "usuarios").subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        if (resp.status) {
          this.lstUsuarios = resp.data;
          // this.refreshAll();
        } else {
          this.func.handleErrors("Server", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
        this.func.handleErrors("Usuarios", err);
      },
    });
  }

  buscar(){
    this.func.showLoading('Buscando');
    let param = btoa(`${this.idusuario}|${this.metodo}|${this.fecha_desde}|${this.fecha_hasta}`)
    this.generalSvc.apiRest("GET", `auditoria/${param}`).subscribe({
      next: (resp: any) => {
        console.log(resp)
        this.func.closeSwal();
        if (resp.status) {
          this.lstData = resp.data;
          this.refreshAll();
        } else {
          this.func.handleErrors("Server", resp.message);
        }
      },
      error: (err: any) => {
        console.log(err)
        this.func.closeSwal();
        this.func.handleErrors("Usuarios", err);
      },
    });
  }


  dataGridStruct() {
    let that = this;
    this.gridOptions = {
      rowData: [],
      pagination: true,
      paginationPageSize: 50,
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
        this.id_selected = event.data.idauditoria_uso;
      },
      columnDefs: [
        {
          headerName: 'ID',
          headerClass: ["th-center", "th-normal"],
          field: 'idauditoria_uso',
          filter: false,
          hide: true,
        },
        {
          headerName: 'Fecha',
          headerClass: ["th-center", "th-normal"],
          field: 'created_at',
          cellClass: 'text-start',
          filter: true,
          maxWidth:200,
          cellRenderer: (params: ICellRendererParams) => {
            return moment(params.value).format("YYYY-MM-DD HH:mm:ss")
          },
        },
        {
          headerName: 'Usuario',
          headerClass: ["th-center", "th-normal"],
          field: 'usuario.nombre',
          cellClass: 'text-start',
          filter: true,
          // flex: 1
        },
        {
          headerName: 'Metodo',
          headerClass: ["th-center", "th-normal"],
          field: 'metodo',
          cellClass: 'text-start',
          filter: true,
          maxWidth:100,
          cellRenderer: (params: ICellRendererParams) => {
            let clase = "";
            switch(params.value){
              case "POST":
                clase = "bg-primary";
                break;
              case "PUT":
                clase = "bg-warning";
                break;
              case "DELETE":
                clase = "bg-danger";
                break;
            }
            return `<kbd class="${clase}">${params.value}</kbd>`;
          },
        },
        {
          headerName: 'Ruta',
          headerClass: ["th-center", "th-normal"],
          field: 'ruta',
          cellClass: 'text-start',
          filter: true,
          // flex: 3
        },
        {
          headerName: 'Data',
          headerClass: ["th-center", "th-normal"],
          field: 'json',
          cellClass: 'text-start',
          filter: false,
          maxWidth:100
        },
        {
          headerName: 'Texto',
          headerClass: ["th-center", "th-normal"],
          field: 'mensaje',
          cellClass: 'text-start',
          filter: false,
          maxWidth:100
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
    this.gridApi!.setGridOption('rowData', this.lstData);
  }

  exportarPDF(){
    let data:any = this.prepareToExport();  
    let params = {
      orientation: "l",
      titulo: "Auditoria de Usuarios",
      data: data,
      filename: `lisah_auditoria_usuarios_${moment().format("YYYYMMDDHHmmss")}.pdf`
    }
    this.func.exportarPDF(params);
  }

  exportarCSV(){
    let data:any = this.prepareToExport();  
    this.func.exportarCSV(data, `lisah_auditoria_usuarios_${moment().format("YYYYMMDDHHmmss")}.csv`);
  }
  
  prepareToExport(): Array<any>{
    let arr:any = [];
    this.lstData.forEach((d:any) => {
      try{
        arr.push({
          fecha: moment(d.created_at).format("YYYY-MM-DD HH:mm:ss"),
          usuario: d.usuario ? d.usuario.nombre  : "",
          metodo: d.metodo,
          ruta: d.ruta,
          json: d.json,
          mensaje: d.mensaje,
        })
      }catch(err){
        console.log(err, d)
      }
    });
    return arr;
  }
}
