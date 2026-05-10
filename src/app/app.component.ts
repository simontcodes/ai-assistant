import { Component, OnInit } from '@angular/core';
import { GoogleAuthService } from './calendar/google-auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(private readonly googleAuthService: GoogleAuthService) {}

  ngOnInit(): void {
    this.googleAuthService.recoverRedirectSessionFromUrl();
  }
}
