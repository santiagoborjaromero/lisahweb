import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dashusuario } from './dashusuario';

describe('Dashusuario', () => {
  let component: Dashusuario;
  let fixture: ComponentFixture<Dashusuario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashusuario]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dashusuario);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
