import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dashmonitor } from './dashmonitor';

describe('Dashmonitor', () => {
  let component: Dashmonitor;
  let fixture: ComponentFixture<Dashmonitor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashmonitor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dashmonitor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
