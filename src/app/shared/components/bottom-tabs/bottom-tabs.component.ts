import { Component } from '@angular/core';

@Component({
  selector: 'app-bottom-tabs',
  templateUrl: './bottom-tabs.component.html',
  styleUrls: ['./bottom-tabs.component.scss'],
  standalone: false,
})
export class BottomTabsComponent {
  readonly tabs = [
    { label: 'Chat', icon: 'chatbox-outline', route: '/assistant' },
    { label: 'Tasks', icon: 'list-outline', route: '/tasks' },
    { label: 'Today', icon: 'calendar-clear-outline', route: '/today' },
    { label: 'Settings', icon: 'settings-outline', route: '/settings' },
  ];
}
