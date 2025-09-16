import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Shareddashboard } from './shareddashboard';

describe('Shareddashboard', () => {
  let component: Shareddashboard;
  let fixture: ComponentFixture<Shareddashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Shareddashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Shareddashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
