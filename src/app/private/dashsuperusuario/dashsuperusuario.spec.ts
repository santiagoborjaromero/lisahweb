import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dashsuperusuario } from './dashsuperusuario';

describe('Dashsuperusuario', () => {
  let component: Dashsuperusuario;
  let fixture: ComponentFixture<Dashsuperusuario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashsuperusuario]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dashsuperusuario);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
