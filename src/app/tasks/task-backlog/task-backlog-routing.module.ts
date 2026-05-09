import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TaskBacklogPage } from './task-backlog.page';

const routes: Routes = [
  {
    path: '',
    component: TaskBacklogPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TaskBacklogPageRoutingModule {}
