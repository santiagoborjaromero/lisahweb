import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Resetpass } from './resetpass';

describe('Resetpass', () => {
  let component: Resetpass;
  let fixture: ComponentFixture<Resetpass>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Resetpass]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Resetpass);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
