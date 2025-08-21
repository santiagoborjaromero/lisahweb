import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Logserver } from './logserver';

describe('Logserver', () => {
  let component: Logserver;
  let fixture: ComponentFixture<Logserver>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Logserver]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Logserver);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
