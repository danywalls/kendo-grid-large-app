import { Component, inject, signal, ChangeDetectionStrategy } from "@angular/core";
import { KENDO_GRID } from "@progress/kendo-angular-grid";
import { ViewerService, Viewer } from "../../services/viewer";

@Component({
  selector: "app-live-grid",
  imports: [KENDO_GRID],
  templateUrl: "./live-grid.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveGrid {
  private viewerService = inject(ViewerService);

  isConnected = signal(false);
  loading = signal(false);
  viewers = signal<Viewer[]>([]);
  pageSize = 1_000;

  connect(): void {
    this.isConnected.set(true);
    this.loadMore();
  }

  onScrollBottom(): void {
    if (this.loading()) return;
    this.loadMore();
  }

  private loadMore(): void {
    this.loading.set(true);

    this.viewerService.fetchPage(this.viewers().length, this.pageSize).then((result) => {
      this.viewers.update((current) => [...current, ...result.data]);
      this.loading.set(false);
    });
  }
}
