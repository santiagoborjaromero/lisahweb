import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dashmaps } from './dashmaps';

describe('Dashmaps', () => {
  let component: Dashmaps;
  let fixture: ComponentFixture<Dashmaps>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashmaps]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dashmaps);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
