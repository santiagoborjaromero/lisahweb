import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Hardeningssh } from './hardeningssh';

describe('Hardeningssh', () => {
  let component: Hardeningssh;
  let fixture: ComponentFixture<Hardeningssh>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Hardeningssh]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Hardeningssh);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
