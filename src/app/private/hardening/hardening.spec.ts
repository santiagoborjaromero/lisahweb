import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Hardening } from './hardening';

describe('Hardening', () => {
  let component: Hardening;
  let fixture: ComponentFixture<Hardening>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Hardening]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Hardening);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
