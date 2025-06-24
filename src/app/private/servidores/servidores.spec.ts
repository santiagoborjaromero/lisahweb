import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Servidores } from './servidores';

describe('Servidores', () => {
  let component: Servidores;
  let fixture: ComponentFixture<Servidores>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Servidores]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Servidores);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
