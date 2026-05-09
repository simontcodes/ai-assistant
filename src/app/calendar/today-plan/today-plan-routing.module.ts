import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TodayPlanPage } from './today-plan.page';

const routes: Routes = [
  {
    path: '',
    component: TodayPlanPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TodayPlanPageRoutingModule {}
