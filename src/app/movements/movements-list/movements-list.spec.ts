import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovementsList } from './movements-list';

describe('MovementsList', () => {
  let component: MovementsList;
  let fixture: ComponentFixture<MovementsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovementsList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MovementsList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
