import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Secondfactor } from './secondfactor';

describe('Secondfactor', () => {
  let component: Secondfactor;
  let fixture: ComponentFixture<Secondfactor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Secondfactor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Secondfactor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
