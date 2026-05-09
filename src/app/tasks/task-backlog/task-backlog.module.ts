import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { SharedComponentsModule } from '../../shared/components/shared-components.module';
import { TaskBacklogPageRoutingModule } from './task-backlog-routing.module';
import { TaskBacklogPage } from './task-backlog.page';

@NgModule({
  imports: [CommonModule, IonicModule, SharedComponentsModule, TaskBacklogPageRoutingModule],
  declarations: [TaskBacklogPage],
})
export class TaskBacklogPageModule {}
