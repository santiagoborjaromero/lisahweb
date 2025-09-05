import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Procesos } from './procesos';

describe('Procesos', () => {
  let component: Procesos;
  let fixture: ComponentFixture<Procesos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Procesos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Procesos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
