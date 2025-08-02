import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
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
import { createGrid, GridApi, GridOptions, ICellRendererParams } from 'ag-grid-community';
import { GrupoUsuarioService } from '../../../core/services/grupousuarios.service';
import Swal from 'sweetalert2';

export interface Datos {
    agente_status: string,
    grupousuarios: any
}; 

@Component({
  selector: 'app-grupousuarios',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './grupousuarios.html',
  styleUrl: './grupousuarios.scss',
  standalone: true
})
export class Grupousuarios implements OnInit{
  private readonly route = inject(ActivatedRoute);
  private readonly sessions = inject(Sessions);
  private readonly func = inject(Functions);
  private readonly serverSvc = inject(ServidorService);
  private readonly agente = inject(WSService);
  private readonly parent = inject(Workspace);
  private readonly grupoSvc = inject(GrupoUsuarioService);
  // private readonly cdRef = inject(ChangeDetectorRef);

  Title = "Grupo de Usuarios";
  TAB = "grupousuarios"

  user:any | undefined;
  work:any | undefined;
  icono = iconsData;

  lstDatos:Datos;
  lstGU:Array<any> = [];
  // sentinel_status = signal<string>("");
  global = Global;

  public dtOptions: any = {};
  public gridOptions: GridOptions<any> = {};
  public gridApi?: GridApi<any>;
  public id_selected: string = '';
  public name_selected: string = '';
  public is_deleted: any = null;

  constructor(){
    this.parent.findTab(this.TAB);
    this.lstDatos = {
      agente_status: "",
      grupousuarios: []
    }
  }

  ngOnInit(): void {
    this.user = JSON.parse(this.sessions.get("user"));
    this.work = JSON.parse(this.sessions.get("work"));
    this.dataGridStruct();

    setTimeout(()=>{
      this.getData();
    },800)

    setTimeout(()=>{
      this.openConn();
    },1300)
  }

  getData() {
    this.lstGU = [];
    this.func.showLoading('Cargando');
    this.id_selected = '';
    this.is_deleted = '';

    this.grupoSvc.getAll().subscribe({
      next: (resp: any) => {
        // console.log(resp);
        this.func.closeSwal();
        if (resp.status) {
          this.lstGU = resp.data;
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

  openConn(){
    this.agente.connect(this.work).subscribe({
      next: (resp)=>{
        console.log("Sentinel->", resp)
        if (resp){
          let result = resp.healthy_agente.split("|");
          this.lstDatos.agente_status = result[1];
          if (result[0] == "OK"){
            let params = {
              action: "comando",
              identificador: {
                idcliente: this.user.idcliente,
                idusuario: this.user.idusuario,
                idservidor: this.work.idservidor,
                id: Math.floor(Math.random() * (9999999999999999 - 1000000000000000 + 1)) + 1000000000000000
              },
              data: [ {"id": "grupousuarios", "cmd": `cat /etc/group`}, ]
            };
            this.onSendCommands(params);
          }
        }
      },
      error: (err)=>{
        console.log("Error", err)
      },
    })
  }

  onSendCommands(params:any){
      this.agente.sendCommand(this.work.idservidor, params)
      .then(resp=>{
        this.lstDatos.grupousuarios = [];
        console.log("<INC>", resp)
        if (resp){
          let data = resp.data.data;
          let r = "";
          let acum:any = [];
          let aux:any | undefined;
          console.log("D", data)
          data.forEach((d:any)=>{
            switch(d.id){
              case "grupousuarios":
                let rd:any = (d.respuesta.split("\n"));
                rd.forEach((rs:any)=>{
                  let rss = rs.split(":");
                  if (rss[0]!="") acum.push(rss)
                })
                acum.forEach((u:any)=>{
                  this.lstDatos.grupousuarios.push({
                    gid: u[2],
                    grupo: u[0],
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
        pagination: true,
        paginationPageSize: 10,
        paginationPageSizeSelector: [5, 10, 50, 100, 200, 300, 1000],
        // rowSelection: 'single',
        rowHeight: 35,
        groupHeaderHeight: 35,
        headerHeight: 35,
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
  
        // skipHeaderOnAutoSize: true,
        onRowClicked: (event: any) => {
          this.id_selected = event.data.idgrupo_usuario;
          this.name_selected = event.data.nombre;
        },
        // autoSizeStrategy: {
        //   type: 'fitCellContents',
        // },
        
        columnDefs: [
          {
            headerName: 'ID',
            headerClass: ["th-center", "th-normal"],
            field: 'idgrupo_usuario',
            filter: false,
            maxWidth:80
          },
          {
            headerName: 'Nombre',
            headerClass: ["th-center", "th-normal"],
            field: 'nombre',
            cellClass: 'text-start',
            filter: true,
          },
          {
            headerName: 'Servidor',
            headerClass: ["th-center", "th-normal2"],
            children:[
              {
                headerName: 'ID',
                headerClass: ["th-center", "th-normal"],
                field: 'gid',
                cellClass: 'text-start',
                filter: true,
                maxWidth: 100
              },
              {
                headerName: 'Grupo',
                headerClass: ["th-center", "th-normal"],
                field: 'grupo',
                cellClass: 'text-start',
                filter: true,
                cellRenderer: (params: ICellRendererParams) => {
                  let icono = "times";
                  let texto = "No existe";
                  let color = "text-danger";
                  if (params.value != "0"){
                    icono = "check";
                    texto = params.value;
                    color = "text-success";
                  }
                  return `<i role="img" class="fas fa-${icono}-circle ${color} t16 mr-2"></i> ${texto}`;
                },
              },
            ]
          },
          {
            headerName: 'Accion',
            headerClass: ["th-center", "th-normal"],
            cellClass: 'text-start',
            filter: true,
            flex: 3,
            maxWidth:100,
            cellRenderer: this.renderAcciones.bind(this),
          },
        ],
      };
  
      that.gridApi = createGrid(document.querySelector<HTMLElement>('#myGrid')!, this.gridOptions );
    }
  
    refreshAll() {
      let found=false;
      let obj:any = null;

      this.lstGU.forEach((gu)=>{
        found = false;
        this.lstDatos.grupousuarios.forEach((s:any)=>{
          if (gu.nombre == s.grupo){
            found = true;
            obj = s;
          }
        })

        if (found){
          gu.gid = obj.gid;
          gu.grupo = obj.grupo;
        } else{
          gu.gid = "";
          gu.grupo = 0;
        }
      })

      var params = {
        force: true,
        suppressFlash: true,
      };
      this.gridApi!.refreshCells(params);
      this.gridApi!.setGridOption('rowData', this.lstGU);
      // this.gridApi!.autoSizeAllColumns();
    }

    renderAcciones(params: ICellRendererParams) {
      let button: any | undefined;
      if (params.data.gid){
      }else{
        button = document.createElement('button');
        button.className = 'btn btn-white';
        button.innerHTML = `<i role="img" class="fas fa-plus text-primary" title='Crear Grupo'></i>`;
        button.addEventListener('click', () => {
          this.crearGrupo(params.data.nombre);
        });
      }
      return button;
    }

    crearGrupo = (id="") => {
      if (this.id_selected == "" && id == ""){
        return
      }

      if (id != ""){
        this.id_selected = id;
      }

      Swal.fire({
          allowOutsideClick: false,
          allowEscapeKey: false,
          title: 'Grupo de Usuarios',
          text: `Seleccione la acción para crear el grupo de usuarios`,
          icon: 'question',
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonColor: '#33a0d6',
          confirmButtonText: 'Crear ahora',
          denyButtonColor: '#2fb990ff',
          denyButtonText: 'Crear después',
          cancelButtonColor: '#f63c3a',
          cancelButtonText: 'Cancelar',
          showClass: { backdrop: 'swal2-noanimation', popup: '' },
          hideClass: { popup: '' },
        }).then((res) => {
          if (res.isConfirmed) {
            this.chearAhora();
          }else if(res.isDenied){

          }
        });
    }


    chearAhora(){
      let nombre = "";
      let lstCmd:any = [];
      this.lstGU.forEach(g=>{
        if (g.idgrupo_usuario == this.id_selected){
          console.log(g)
          nombre = g.nombre;
          lstCmd = g.scripts.cmds;
        }
      })

      let cmds:any = [];
      lstCmd.forEach((e:any) => {
        cmds.push({
          id: e.idtemplate_comando,
          cmd: e.linea_comando
        })
      });

      let params = {
        action: "comando",
        identificador: {
          idcliente: this.user.idcliente,
          idusuario: this.user.idusuario,
          idservidor: this.work.idservidor,
          id: Math.floor(Math.random() * (9999999999999999 - 1000000000000000 + 1)) + 1000000000000000
        },
        data: cmds
      };
      this.onSendCommands(params);

      setTimeout(()=>{
        this.openConn();
      },1000)
    }



}

