import { CommonModule } from '@angular/common';
import { Component, effect, Input, signal, SimpleChanges } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Global } from '../../../core/config/global.config';


@Component({
  selector: 'app-grid',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './grid.html',
  styleUrl: './grid.scss',
})
export class Grid {
  @Input() importData : any = {};
  @Input() importHead : Array<any> = [];

  lstData: Array<any> = [];
  lstPage: any = {
    number_records: 0,
    total_records: 0,
    rows_per_page: 0,
    number_page: 0,
    record_start: 0,
  };
  paginationPageSizeSelector =  Global.paginationPageSizeSelector;
  rows_per_page: number =  Global.paginationPageSize;

  enabledAnterior:boolean = false;
  enabledSiguiente:boolean = false;
  
  pages: Array<any> = [];
  current_page: number = 1;
  total_pages: number = 1;
  min_pages: number = 1;
  total_records: number = 0;

  start = 1;
  end = 0;

  ngOnInit(): void {
    
  }

  ngOnChanges(changes: SimpleChanges): void {
    // console.log (changes)

    try{
      let lstD = changes["importData"]["currentValue"];
      this.lstData = lstD.data;
      this.lstPage = lstD.page;
      this.populatePage();
    }catch(ex){ }
  }

  populatePage(){
    if (this.lstPage.lenght==0){
      return
    }

    this.rows_per_page = this.lstPage.rows_per_page;

    /** Calcular el numero de pagina */
    let entero = Math.floor(this.lstPage.total_records / this.rows_per_page);
    let decimal = (this.lstPage.total_records % this.rows_per_page)>0 ? 1 : 0;
    this.total_pages = entero + decimal;

    /** Calcular el inicio y fin de la pagina , numero de registros */
    this.total_records = this.lstPage.total_records;
    this.start = this.lstPage.record_start;
    this.end = this.lstPage.number_page * this.rows_per_page ;


    /** Calcular botones y si esta habilitado anterior y siguiente */
    let top = 0;
    if (this.total_pages > 7){
      top = 7;
    } else if (this.total_pages < 7){
      top = this.total_pages;
    }

    for(let i=1 ;i<=top; i++){
      this.pages.push(i);
    }
    this.current_page = this.lstPage.number_page;

    if (this.current_page > 1){
      this.enabledAnterior = true;
    }else{
      this.enabledAnterior = false;
    }

    if (this.current_page < this.total_pages){
      this.enabledSiguiente = true;
    }else{
      this.enabledSiguiente = false;
    }

    // number_records
    // total_records
    // rows_per_page
    // number_page
    // record_start

  }


}
