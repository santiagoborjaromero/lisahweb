import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Sessions } from '../../../core/helpers/session.helper';

@Component({
  selector: 'app-servicios',
  imports: [],
  templateUrl: './servicios.html',
  styleUrl: './servicios.scss',
})
export class Servicios {
  private readonly route = inject(ActivatedRoute);
  private readonly sessions = inject(Sessions);

  work: any | undefined;

  ngOnInit(): void {
    console.log('ngOnInit');
    this.work = JSON.parse(this.sessions.get("work"));
    console.log(this.work);
  }

  ngAfterViewInit(): void {
    console.log('ngAfterViewInit');
  }
}
