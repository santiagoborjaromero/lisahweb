import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Sessions } from '../../../core/helpers/session.helper';
import { Functions } from '../../../core/helpers/functions.helper';
import { ServidorService } from '../../../core/services/servidor.service';

@Component({
  selector: 'app-general',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './general.html',
  styleUrl: './general.scss',
  standalone: true
})
export class General {
  private readonly route = inject(ActivatedRoute);
  private readonly sessions = inject(Sessions);
  private readonly func = inject(Functions);
  private readonly serverSvc = inject(ServidorService);

  work:any | undefined;

  ngOnInit(): void {
    console.log("ngOnInit")
    this.work = this.sessions.get("work");
    // console.log(this.work);
  }
  
  ngAfterViewInit(): void {
    console.log("ngAfterViewInit")
    this.getUsuario();
  }

  getUsuario() {
    this.func.showLoading('Cargando');

    this.serverSvc.getOne(this.work.idservidor).subscribe({
      next: (resp: any) => {
        this.func.closeSwal();
        console.log(resp);
        if (resp.status) {

        } else {
          this.func.showMessage("error", "Usuario", resp.message);
        }
      },
      error: (err: any) => {
        this.func.closeSwal();
      },
    });
  }



}
