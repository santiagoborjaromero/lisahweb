import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Grupousuarios } from './grupousuarios';

describe('Grupousuarios', () => {
  let component: Grupousuarios;
  let fixture: ComponentFixture<Grupousuarios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Grupousuarios]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Grupousuarios);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
