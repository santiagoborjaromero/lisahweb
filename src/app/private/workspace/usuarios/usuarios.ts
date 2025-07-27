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
import {
  AllCommunityModule,
  createGrid,
  GridApi,
  GridOptions,
  ICellRendererParams,
  ModuleRegistry,
} from 'ag-grid-community';

export interface Datos {
  agente_status: string
  usuarios: any
}

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-usuarios',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class Usuarios implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly sessions = inject(Sessions);
  private readonly func = inject(Functions);
  private readonly serverSvc = inject(ServidorService);
  private readonly agente = inject(WSService);
  private readonly parent = inject(Workspace);

  Title = 'Usuarios';
  TAB = 'usuarios';

  user: any | undefined;
  work: any | undefined;
  icono = iconsData;

  lstDatos: Datos;
  global = Global;

  public dtOptions: any = {};
  public gridOptions: GridOptions<any> = {};
  public gridApi?: GridApi<any>;
  public id_selected: string = '';
  public name_selected: string = '';
  public is_deleted: any = null;

  // lstUsuarios: Array<any> = [];

  constructor() {
    this.parent.findTab(this.TAB);
    this.lstDatos = {
      agente_status: '',
      usuarios: []
    };
  }

  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get('user'));
    this.work = JSON.parse(this.sessions.get('work'));

    this.dataGridStruct();
    
    setTimeout(()=>{
      this.openConn();
    },500)
  }

  openConn() {
    this.agente.connect(this.work).subscribe({
      next: (resp) => {
        console.log('Sentinel->', resp);
        if (resp) {
          let result = resp.healthy_agente.split('|');
          this.lstDatos.agente_status = result[1];
          if (result[0] == 'OK') {
            this.onSendCommands();
          }
        }
      },
      error: (err) => {
        console.log('Error', err);
      },
    });
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
        {"id": "usuarios", "cmd": `lslogins --user-accs --output=USER,UID,GECOS,HOMEDIR,SHELL,NOLOGIN,PWD-LOCK,PWD-EMPTY,PWD-DENY,PWD-METHOD,GROUP,GID,SUPP-GROUPS,SUPP-GIDS,LAST-LOGIN,LAST-TTY,LAST-HOSTNAME,FAILED-LOGIN,FAILED-TTY,HUSHED,PWD-WARN,PWD-CHANGE,PWD-MIN,PWD-MAX,PWD-EXPIR,CONTEXT,PROC --colon-separate | sed '1,1d'`},
      ]
    };

    this.agente.sendCommand(this.work.idservidor, params)
    .then(resp=>{
      this.lstDatos.usuarios = [];
      console.log("<INC>", resp)
      if (resp){
        let data = resp.data.data;
        let r = "";
        let acum:any = [];
        let aux:any | undefined;
        console.log("D", data)
        data.forEach((d:any)=>{
          switch(d.id){
            case "usuarios":
              let rd:any = (d.respuesta.split("\n"));
              rd.forEach((rs:any)=>{
                let rss = rs.split(":");
                if (rss[0]!="") acum.push(rss)
              })
              // console.log(acum)
              // this.lstDatos.usuarios = acum;
              acum.forEach((u:any)=>{
                // console.log(u)
                let gid1 = u[11].split(",");
                let grupo1 = u[10].split(",");
                let gid2 = u[13].split(",");
                let grupo2 = u[12].split(",");
                let gid = gid1.concat(gid2);
                let grupo = grupo1.concat(grupo2);

                let grupoid:Array<any> = [];
                gid.forEach((e:any)=>{
                  if (e!=""){
                    grupoid.push(e)
                  }
                })
                let gruponombre:Array<any> = [];
                grupo.forEach((e:any)=>{
                  if (e!=""){
                    gruponombre.push(e)
                  }
                })

                this.lstDatos.usuarios.push({
                  user: u[0],
                  uid: u[1],
                  gecos: u[2],
                  homedir: u[3],
                  shell: u[4],
                  nologin: u[5],
                  pwdlock: u[6],
                  pwdempty: u[7],
                  pwddeny: u[8],
                  pwdmethod: u[9],
                  gid: grupoid.join(", "),
                  group: gruponombre.join(", "),
                  lastlogin: u[14],
                  lasttty: u[15],
                  lasthostname: u[16],
                  failedlogin: u[17],
                  failedtty: u[18],
                  hushed: u[19],
                  pwdwarn: u[20],
                  pwdchange: u[21],
                  pwdmin: u[22],
                  pwdmax: u[23],
                  pwdexpire: u[24],
                  context: u[25],
                  proc: u[26],

                })
              });
              // console.log(this.lstDatos.usuarios)
              this.refreshAll();
              break;
          }
        })
      }
    })
    .catch(err=>{

    })
  }



  dataGridStruct() {
    let that = this;
    this.gridOptions = {
      rowData: [],
      pagination: false,
      paginationPageSize: 50,
      paginationPageSizeSelector: [5, 10, 50, 100, 200, 300, 1000],
      // rowSelection: 'single',
      rowHeight: 35,
      groupHeaderHeight: 35,
      headerHeight: 35,
      defaultColDef: {
        minWidth: 90,
        filter: false,
        headerClass: 'bold',
        floatingFilter: false,
        resizable: false,
        sortable: false,
        wrapText: true,
        wrapHeaderText: true,
        suppressAutoSize: false,
        autoHeaderHeight: false,
        suppressSizeToFit: false,
        autoHeight: true,
        cellDataType: 'text',
      },

      skipHeaderOnAutoSize: true,
      onRowClicked: (event: any) => {
        this.id_selected = event.data.uid;
        this.name_selected = event.data.user;
      },
      // autoSizeStrategy: {
      //   type: 'fitCellContents',
      // },
      
      columnDefs: [
        {
          headerName: 'ID',
          headerClass: 'th-normal',
          field: 'uid',
          cellClass: 'text-start',
          filter: false,
          pinned: 'left',
          maxWidth:80
        },
        {
          headerName: 'Usuario',
          headerClass: 'th-normal',
          field: 'user',
          cellClass: 'text-start',
          filter: true,
          pinned: 'left',
        },
        {
          headerName: 'Grupo ID',
          headerClass: 'th-normal',
          field: 'gid',
          cellClass: 'text-start',
          filter: true,
          maxWidth:100
        },
        {
          headerName: 'Grupo',
          headerClass: 'th-normal',
          field: 'group',
          cellClass: 'text-start',
          filter: true,
        },
        {
          headerName: 'Ultimo Ingreso',
          headerClass: 'th-normal2',
          children:[
            {
              headerName: 'Host',
              headerClass: 'th-normal',
              field: 'lasthostname',
              cellClass: 'text-start',
              filter: true,
              maxWidth:150
            },
            {
              headerName: 'Fecha',
              headerClass: 'th-normal',
              field: 'lastlogin',
              cellClass: 'text-start',
              filter: true,
              maxWidth:150
            },
          ]
        },
        {
          headerName: 'Password',
          headerClass: 'th-normal2',
          children:[
            {
              headerName: 'Warning',
              headerClass: 'th-normal',
              field: 'pwdwarn',
              cellClass: 'text-start',
              filter: true,
              maxWidth:150
            },
            {
              headerName: 'Min',
              headerClass: 'th-normal',
              field: 'pwdmin',
              cellClass: 'text-start',
              filter: true,
              maxWidth:150
            },
            {
              headerName: 'Max',
              headerClass: 'th-normal',
              field: 'pwdmax',
              cellClass: 'text-start',
              filter: true,
              maxWidth:150
            },
            {
              headerName: 'Cambiado',
              headerClass: 'th-normal',
              field: 'pwdchange',
              cellClass: 'text-start',
              filter: true,
              maxWidth:150
            },
            {
              headerName: 'Expira',
              headerClass: 'th-normal',
              field: 'pwdexpire',
              cellClass: 'text-start',
              filter: true,
              maxWidth:150
            },
          ]
        },
        
        
      ],
    };

    that.gridApi = createGrid(document.querySelector<HTMLElement>('#myGrid')!, this.gridOptions );
  }

  refreshAll() {
    var params = {
      force: true,
      suppressFlash: true,
    };
    this.gridApi!.refreshCells(params);
    this.gridApi!.setGridOption('rowData', this.lstDatos.usuarios);
    // this.gridApi!.autoSizeAllColumns();
  }

  // renderAccionNombre(params: ICellRendererParams) {
  //   let data = params.data;
  //   let nombre = data.nombre;
  //   this.id_selected = data.idservidor;

  //   const button = document.createElement('button');
  //   button.className = 'btn btn-white';
  //   button.innerHTML = `<span class="link" title='Editar'>${nombre}</span>`;
  //   button.addEventListener('click', () => {
  //     // this.funcEdit();
  //   });
  //   return button;
  // }
}
