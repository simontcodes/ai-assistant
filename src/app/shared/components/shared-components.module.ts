import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AssistantAvatarComponent } from './assistant-avatar/assistant-avatar.component';
import { BottomTabsComponent } from './bottom-tabs/bottom-tabs.component';
import { ChatMessageComponent } from './chat-message/chat-message.component';
import { SuggestionCardComponent } from './suggestion-card/suggestion-card.component';
import { TaskCardComponent } from './task-card/task-card.component';
import { TimelineGapCardComponent } from './timeline-gap-card/timeline-gap-card.component';

@NgModule({
  declarations: [
    AssistantAvatarComponent,
    BottomTabsComponent,
    ChatMessageComponent,
    SuggestionCardComponent,
    TaskCardComponent,
    TimelineGapCardComponent,
  ],
  imports: [CommonModule, IonicModule, RouterModule],
  exports: [
    AssistantAvatarComponent,
    BottomTabsComponent,
    ChatMessageComponent,
    SuggestionCardComponent,
    TaskCardComponent,
    TimelineGapCardComponent,
  ],
})
export class SharedComponentsModule {}
