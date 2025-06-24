import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Breadcrums } from './breadcrums';

describe('Breadcrums', () => {
  let component: Breadcrums;
  let fixture: ComponentFixture<Breadcrums>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Breadcrums]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Breadcrums);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
