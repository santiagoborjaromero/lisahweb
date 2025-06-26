import { CommonModule, formatNumber } from '@angular/common';
import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Header } from '../shared/header/header';
import { Breadcrums } from '../shared/breadcrums/breadcrums';
import { themeBalham, ModuleRegistry, AllCommunityModule, createGrid, GridApi, GridOptions, ICellRendererParams, ValueFormatterParams, provideGlobalGridOptions} from 'ag-grid-community';
import { Global } from '../../core/config/global.config';
import { Menuservice } from '../../core/services/menuservice';
import { Functions } from '../../core/helpers/functions.helper';
import { Sessions } from '../../core/helpers/session.helper';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-menu',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, Header, Breadcrums],
  templateUrl: './menu.html',
  styleUrl: './menu.scss',
})
export class Menu {
  @ViewChild('myGrid', { static: false }) myGrid!: ElementRef;

  private readonly menuSvc = inject(Menuservice);
  private readonly func = inject(Functions);
  private readonly sessions = inject(Sessions);

  title = 'Menu de Opciones';
  rutas: Array<any> = ['Creadores', 'Menú de Opciones'];

  public dtOptions: any = {};
  public gridOptions: GridOptions<any> = {};
  public gridApi?: GridApi<any>;
  public id_selected: string = '';
  myTheme = themeBalham.withParams({ accentColor: 'red' });
  lstData = [];

  ngOnInit(): void {
    setTimeout(() => {
      this.dataGridStruct();
    }, Global.times[0]);
    setTimeout(() => {
      this.getData();
    }, Global.times[1]);
  }

  ngOnDestroy(): void {}

  getData() {
    this.lstData = [];
    this.func.showLoading('Cargando');

    this.menuSvc.all().subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        if (resp.status) {
          this.lstData = resp.data;
          this.refreshAll();
        } else {
          this.func;
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
      },
    });
  }

  funcEdit(id:any=null){
    this.func.goRoute(`admin/menu/${id ?  id : this.id_selected}`, true)
  }
  funcDelete(){}


  dataGridStruct() {
    let that = this;
    this.gridOptions = {
      rowData: [],
      pagination: true,
      paginationPageSize: 50,
      paginationPageSizeSelector: [5, 10, 50, 100, 200, 300, 1000],
      // rowSelection: 'single',
      rowHeight: 50,
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
        this.id_selected = event.data.idmenu;
        // this.selectCuenta();
      },
      columnDefs: [
        {
          headerName: 'ID',
          field: 'idmenu',
          filter: false,
          hide: true,
        },
        {
          headerName: 'Orden',
          field: 'orden',
          cellClass: 'text-start',
          sort: "asc",
          // cellRenderer: (params: ICellRendererParams) => {
          //   let data = params.data;
          //   return `<kbd class="${data.clase} mt-1 pt-1"><i class="${data.icono} text-white"></i></kbd> ${data.tipo}`;
          // },
        },
        {
          headerName: 'Nombre',
          field: 'nombre',
          cellClass: 'text-start',
          flex: 2,
          cellRenderer: (params: ICellRendererParams) => {
            let data = params.data;
            let nombre = data.nombre;
            let submenu = data.es_submenu;
            let text = "";
            if (submenu == 1){
              text = nombre;
            }else{
              text = "└── " + nombre;
            }
            return text;
          },
        },
        {
          headerName: 'Icono',
          field: 'icono',
          cellClass: 'text-start',
          cellRenderer: (params: ICellRendererParams) => {
            let data = params.data;
            let icono = data.icono;
            return `<i class="${icono}"></i>`;
          },
        },
        {
          headerName: 'Ruta',
          field: 'ruta',
          cellClass: 'text-start',
        },
        {
          headerName: 'Submenu',
          field: 'es_submenu',
          cellClass: 'text-start',
          cellRenderer: (params: ICellRendererParams) => {
            let data = params.data;
            let status = data.es_submenu;
            let text = 'Item';
            let color = 'bg-info';
            if (status == 1) {
              color = 'bg-success';
              text = 'Si';
            }
            return `<kbd class="${color} text-white">${text}</kbd>`;
          },
        },
        {
          headerName: 'Estado',
          field: 'estado',
          cellClass: 'text-start',
          // sort: "asc",
          cellRenderer: (params: ICellRendererParams) => {
            let data = params.data;
            let status = data.estado;
            let text = 'Inactivo';
            let color = 'bg-danger';
            if (status == 1) {
              color = 'bg-success';
              text = 'Activo';
            }
            return `<kbd class="${color} text-white">${text}</kbd>`;
          },
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
}
