import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SharedComponentsModule } from '../../shared/components/shared-components.module';
import { AssistantChatPageRoutingModule } from './assistant-chat-routing.module';
import { AssistantChatPage } from './assistant-chat.page';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, SharedComponentsModule, AssistantChatPageRoutingModule],
  declarations: [AssistantChatPage],
})
export class AssistantChatPageModule {}
