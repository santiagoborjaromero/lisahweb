import { Component, inject } from '@angular/core';
import { Breadcrums } from '../../shared/breadcrums/breadcrums';
import { Header } from '../../shared/header/header';
import { CommonModule } from '@angular/common';
import vForm from './vform';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Functions } from '../../../core/helpers/functions.helper';
import { Sessions } from '../../../core/helpers/session.helper';
import { TemplateService } from '../../../core/services/template';
import { ScriptsService } from '../../../core/services/script';
import { AllCommunityModule, createGrid, GridApi, GridOptions, ICellRendererParams, ModuleRegistry, RowDragModule } from 'ag-grid-community';
import { Global } from '../../../core/config/global.config';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-edit',
  imports: [Breadcrums, Header, CommonModule, FormsModule],
  templateUrl: './edit.html',
  styleUrl: './edit.scss'
})
export class Edit {

  private readonly route = inject(ActivatedRoute);
  private readonly func = inject(Functions);
  private readonly sessions = inject(Sessions);
  private readonly tempSvc = inject(TemplateService);
  private readonly scriptSvc = inject(ScriptsService);

  user: any = null;
  idscript: string = "";
  rstData: any;
  validador:any = vForm;

  nombre: string = "";
  linea: string = "";
  activeTemplate: boolean = true;

  lstTemplate: Array<any> = [];
  lstCmds: Array<any> = [];

  public dtOptions: any = {};
  public gridOptions: GridOptions<any> = {};
  public gridApi?: GridApi<any>;
  public id_selected: string = '';
  public is_deleted: any = null;

  public canR: boolean = false;
  public canW: boolean = false;
  public canD: boolean = false;


  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get('user'));

    let uIDUser = this.route.snapshot.paramMap.get('id');

    if (uIDUser && uIDUser != '-1') {
      this.idscript = uIDUser;
    }else{
      this.idscript = "";
    }

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
  }

  ngAfterViewInit(): void {
    this.dataGridStruct();

    if (this.idscript != ""){
      setTimeout(() => {
        this.getData();
      }, Global.times[0]);
    }

    this.getTemplates();
  }

  getData(){
    this.rstData = null;

    this.func.showLoading('Cargando');

    this.scriptSvc.getOne(this.idscript).subscribe({
      next: (resp: any) => {
        console.log(resp);
        this.func.closeSwal();
        if (resp.status) {
          this.rstData = resp.data[0];
          this.lstCmds = this.rstData.cmds;
          this.nombre = this.rstData.nombre;
          this.refreshAll();
        } else {
          this.func.showMessage("error", "Usuario", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
      },
    });
  }

  getTemplates(){
    this.lstTemplate = [];

    this.tempSvc.getAll().subscribe({
      next: (resp: any) => {
        console.log(resp);
        if (resp.status) {
          this.lstTemplate = resp.data;
        } else {
          this.func.showMessage("error", "Templates", resp.message);
        }
      },
      error: (err: any) => {
        this.func.showMessage("error", "Templates", err);
      },
    });
  }


  funcSubmit(){}
  funcCancelar(){}

  dataGridStruct() {
      let that = this;
      this.gridOptions = {
        rowData: [],
        pagination: false,
        paginationPageSize: 50,
        paginationPageSizeSelector: [5, 10, 50, 100, 200, 300, 1000],
        // rowSelection: 'single',
        rowHeight: 50,
        rowDragEntireRow: true,
        defaultColDef: {
          flex: 1,
          minWidth: 100,
          filter: true,
          // enableCellChangeFlash: true,
          headerClass: 'bold',
          floatingFilter: true,
          resizable: false,
          sortable: true,
        },
        onRowClicked: (event: any) => {
          this.id_selected = event.data.idtemplate_comando;
          this.is_deleted = event.data.deleted_at;
        },
        onRowDragEnd: (event) => {
          // console.log(this.lstCmds)
          // const rowData:any = [];
          // this.gridApi.forEachNode((node:any) => rowData.push(node.data));
          // this.gridApi.setRowData(rowData);
        },
        rowDragManaged: true,
        columnDefs: [
        {
          headerName: 'ID',
          field: 'idtemplate_comando',
          filter: false,
          hide: true,
        },
        {
          headerName: 'Línea de Comando',
          field: 'linea_comando',
          cellClass: 'text-start',
          filter: true,
          flex: 11,
          rowDrag: true
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
      this.gridApi!.setGridOption('rowData', this.lstCmds);
    }

}
