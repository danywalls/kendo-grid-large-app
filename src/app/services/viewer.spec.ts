import { TestBed } from '@angular/core/testing';

import { Viewer } from './viewer';

describe('Viewer', () => {
  let service: Viewer;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Viewer);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
