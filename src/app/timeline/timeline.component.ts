import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent implements OnInit {

  constructor() { }

  ngOnInit() {
    timeline(document.querySelectorAll('.timeline'), {
      foreVerticalMode: 800,
      mode: 'horizontal',
      visibleItems: 4,
      dragColor: 'aqua',
      ptColor: 'violet',
    });
  }

}
