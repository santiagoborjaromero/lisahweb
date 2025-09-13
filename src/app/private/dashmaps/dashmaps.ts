import { Component, ElementRef, inject, ViewChild, viewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-dashmaps',
  imports: [],
  templateUrl: './dashmaps.html',
  styleUrl: './dashmaps.scss'
})
export class Dashmaps {
  // @ViewChild("map") map!: ElementRef;
  private readonly sanitizer = inject(DomSanitizer); 

  iframe:any = "" 

  constructor(){
    let url = "http://localhost:3000/public-dashboards/33cbccaaf9004829a6c124ddfa54203b?kiosk=tv";
    this.iframe = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }


} 
