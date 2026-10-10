import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, TopbarComponent],
  template: `
    <div class="layout-container">
      <app-sidebar></app-sidebar>
      <div class="main-wrapper">
        <app-topbar></app-topbar>
        <main class="page-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .layout-container {
      display: flex;
      min-height: 100vh;
      background-color: var(--slate-50);
    }

    .main-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .page-content {
      flex: 1;
      padding: 1.75rem 2rem;
      max-width: 1600px;
      width: 100%;
      margin: 0 auto;
    }

    @media (max-width: 768px) {
      .page-content {
        padding: 1rem;
      }
    }
  `]
})
export class MainLayoutComponent {}
