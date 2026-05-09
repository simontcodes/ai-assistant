import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { SharedComponentsModule } from '../../shared/components/shared-components.module';
import { TodayPlanPageRoutingModule } from './today-plan-routing.module';
import { TodayPlanPage } from './today-plan.page';

@NgModule({
  imports: [CommonModule, IonicModule, SharedComponentsModule, TodayPlanPageRoutingModule],
  declarations: [TodayPlanPage],
})
export class TodayPlanPageModule {}
