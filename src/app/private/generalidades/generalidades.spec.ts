import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Generalidades } from './generalidades';

describe('Generalidades', () => {
  let component: Generalidades;
  let fixture: ComponentFixture<Generalidades>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Generalidades]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Generalidades);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
