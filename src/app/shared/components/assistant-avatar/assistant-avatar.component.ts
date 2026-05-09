import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-assistant-avatar',
  templateUrl: './assistant-avatar.component.html',
  styleUrls: ['./assistant-avatar.component.scss'],
  standalone: false,
})
export class AssistantAvatarComponent {
  @Input() name = 'Milo';
  @Input() state: 'idle' | 'listening' | 'thinking' | 'suggesting' | 'success' | 'warning' = 'idle';
  @Input() size: 'sm' | 'md' | 'lg' = 'lg';
}
