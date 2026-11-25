import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/shared/sidebar.component';
import { HeaderComponent } from './components/shared/header.component';
import { ToastComponent } from './components/shared/toast.component';
import { ManagerPinModalComponent } from './components/shared/manager-pin-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent, ToastComponent, ManagerPinModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'HospitalityOS';
}
