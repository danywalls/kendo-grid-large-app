import { Component, inject, signal } from "@angular/core";
import { KENDO_GRID } from "@progress/kendo-angular-grid";
import { LiveGrid } from "./components/live-grid/live-grid";
import { ViewerService, Viewer } from "./services/viewer.service";

@Component({
  selector: "app-root",
  imports: [KENDO_GRID, LiveGrid],
  templateUrl: "./app.html",
})
export class App {
  private service = inject(ViewerService);
  viewers = signal<Viewer[]>([]);

  // Simple signal to toggle between the basic virtualization demo and the live scale feed
  activeTab = signal<'basic' | 'scale'>('basic');

  loadViewers(count: number): void {
    const data = this.service.getViewers(count);
    this.viewers.set(data);
  }
}
