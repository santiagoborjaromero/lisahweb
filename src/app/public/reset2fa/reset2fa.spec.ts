import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Reset2fa } from './reset2fa';

describe('Reset2fa', () => {
  let component: Reset2fa;
  let fixture: ComponentFixture<Reset2fa>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reset2fa]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Reset2fa);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
