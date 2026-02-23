import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveGrid } from './live-grid';

describe('LiveGrid', () => {
  let component: LiveGrid;
  let fixture: ComponentFixture<LiveGrid>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveGrid]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LiveGrid);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
