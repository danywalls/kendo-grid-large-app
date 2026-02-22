import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import {
  KENDO_GRID,
  PageChangeEvent,
  GridDataResult,
} from "@progress/kendo-angular-grid";
import { ViewerService } from "../../services/viewer";

@Component({
  selector: "app-live-grid",
  imports: [KENDO_GRID],
  templateUrl: "./live-grid.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveGrid {
  private viewerService = inject(ViewerService);

  skip = signal(0);
  loading = signal(false);
  isConnected = signal(false);

  readonly pageSize = 100;

  private gridData = signal<GridDataResult>({ data: [], total: 0 });

  gridView = computed<GridDataResult>(() => this.gridData());
  total = computed(() => this.gridData().total);

  async connect(): Promise<void> {
    this.isConnected.set(true);
    await this.loadPage(0);
  }

  async onPageChange(event: PageChangeEvent): Promise<void> {
    this.skip.set(event.skip);
    await this.loadPage(event.skip);
  }

  private async loadPage(skip: number): Promise<void> {
    this.loading.set(true);
    const result = await this.viewerService.fetchPage(skip, this.pageSize);
    this.gridData.set(result);
    this.loading.set(false);
  }
}
