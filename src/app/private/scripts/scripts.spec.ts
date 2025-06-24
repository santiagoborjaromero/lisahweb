import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Scripts } from './scripts';

describe('Scripts', () => {
  let component: Scripts;
  let fixture: ComponentFixture<Scripts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Scripts]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Scripts);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
