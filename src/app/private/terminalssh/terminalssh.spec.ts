import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Terminalssh } from './terminalssh';

describe('Terminalssh', () => {
  let component: Terminalssh;
  let fixture: ComponentFixture<Terminalssh>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Terminalssh]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Terminalssh);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
