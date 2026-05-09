import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'assistant',
    loadChildren: () => import('./assistant/assistant-chat/assistant-chat.module').then((m) => m.AssistantChatPageModule),
  },
  {
    path: 'tasks',
    loadChildren: () => import('./tasks/task-backlog/task-backlog.module').then((m) => m.TaskBacklogPageModule),
  },
  {
    path: 'today',
    loadChildren: () => import('./calendar/today-plan/today-plan.module').then((m) => m.TodayPlanPageModule),
  },
  {
    path: 'settings',
    loadChildren: () => import('./settings/settings.module').then((m) => m.SettingsPageModule),
  },
  {
    path: '',
    redirectTo: 'assistant',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
