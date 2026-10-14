import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { AssistantPanelComponent } from '../assistant-panel/assistant-panel.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, TopbarComponent, AssistantPanelComponent],
  template: `
    <div class="layout-container">
      <app-sidebar></app-sidebar>
      <app-assistant-panel></app-assistant-panel>
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
      height: 100vh;
      overflow: hidden;
      background-color: var(--slate-50);
    }

    .main-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100vh;
      min-width: 0;
      overflow: hidden;
    }

    .page-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 0.75rem 1rem;
      max-width: 1600px;
      width: 100%;
      margin: 0 auto;
    }

    .page-content::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    .page-content::-webkit-scrollbar-track {
      background: transparent;
    }

    .page-content::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 9999px;
    }

    .page-content::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }

    @media (max-width: 768px) {
      .page-content {
        padding: 1rem;
      }
    }
  `]
})
export class MainLayoutComponent {}
