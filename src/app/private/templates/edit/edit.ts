import { Component, inject } from '@angular/core';
import { Breadcrums } from '../../shared/breadcrums/breadcrums';
import { Header } from '../../shared/header/header';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Functions } from '../../../core/helpers/functions.helper';
import { Sessions } from '../../../core/helpers/session.helper';
import { TemplateService } from '../../../core/services/template';
import { VariablesService } from '../../../core/services/variables';
import vForm from './vform';


@Component({
  selector: 'app-edit',
  imports: [Breadcrums, Header, FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './edit.html',
  styleUrl: './edit.scss',
  standalone: true
})
export class Edit {

  private readonly route = inject(ActivatedRoute);
  private readonly func = inject(Functions);
  private readonly sessions = inject(Sessions);
  private readonly tempSvc = inject(TemplateService);
  private readonly varSvc = inject(VariablesService);
  
  user: any = null;
  idtemplate: string = "";
  rstData: any;

  alias:string = "";
  linea_comando:string = "";
  lstVariables:Array<any> = [];
  verAyuda: boolean = false;

  validador:any = vForm; 

  public canR: boolean = false;
  public canW: boolean = false;
  public canD: boolean = false;

  ngOnInit(): void {

    this.user = JSON.parse(this.sessions.get('user'));

    let uIDUser = this.route.snapshot.paramMap.get('id');

    if (uIDUser && uIDUser != '-1') {
      this.idtemplate = uIDUser;
    }else{
      this.idtemplate = "";
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
    this.getVariables();

    if (this.idtemplate != ""){
      this.getData();
    }
  }

  ngOnDestroy(): void {
    this.func.encerarCampos(this.validador);
  }

  getData(){
    this.rstData = null;
    this.func.showLoading('Cargando');
    this.tempSvc.getOne(this.idtemplate).subscribe({
      next: (resp: any) => {
        // console.log(resp);
        this.func.closeSwal();
        if (resp.status) {
          this.rstData = resp.data[0];
          this.linea_comando = this.rstData.linea_comando;
        } else {
          this.func.showMessage("error", "Usuario", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
      },
    });
  }

  getVariables(){
    this.rstData = null;
    this.varSvc.getAll().subscribe({
      next: (resp: any) => {
        // console.log(resp);
        if (resp.status) {
          this.lstVariables = resp.data;
        } else {
          this.func.showMessage("error", "Usuario", resp.message);
        }
      },
      error: (err: any) => {
      },
    });
  }

  addText(variable = ""){
    this.linea_comando += `{${variable}}` ;
  }

  funcSubmit(){
    let data = {
      alias: this.alias,
      linea_comando: this.linea_comando
    };
    if(this.func.validaCampos(this.validador, data)){
      return;
    }

    let param = { data };

    this.func.showLoading('Guardando');

    this.tempSvc.save(param, this.idtemplate).subscribe({
      next: (resp: any) => {
        // console.log(resp)
        this.func.closeSwal();
        if (resp.status) {
          this.funcCancelar();
        } else {
          this.func.showMessage("error", "Template de Comandos", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
      },
    });
  }

  funcCancelar(){
    this.func.goRoute(`admin/templates`, false, true);
  }
}
