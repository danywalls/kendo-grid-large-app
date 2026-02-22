import { Component, inject, signal, computed, resource, effect, untracked, DestroyRef, ChangeDetectionStrategy } from "@angular/core";
import {
    KENDO_GRID,
    PageChangeEvent,
    GridDataResult,
} from "@progress/kendo-angular-grid";
import { ViewerService } from "../../services/viewer.service";

@Component({
    selector: "app-live-grid",
    imports: [KENDO_GRID],
    templateUrl: "./live-grid.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: [`
    :host ::ng-deep .k-grid-table tr { height: 36px; }
  `]
})
export class LiveGrid {
    private viewerService = inject(ViewerService);
    private destroyRef = inject(DestroyRef);

    skip = signal(0);
    isConnected = signal(false);
    liveTotal = signal(0);
    readonly pageSize = 100;

    viewersResource = resource({
        params: () => ({ skip: this.skip(), isConnected: this.isConnected() }),
        loader: async ({ params, abortSignal }) => {
            if (!params.isConnected) return [];
            return this.viewerService.fetchPage(params.skip, this.pageSize, abortSignal);
        },
    });

    private gridData = signal<any[]>([]);

    constructor() {
        effect(() => {
            const value = this.viewersResource.value();
            if (value !== undefined) {
                untracked(() => this.gridData.set(value));
            }
        });
    }

    gridView = computed<GridDataResult>(() => ({
        data: this.gridData(),
        total: this.liveTotal()
    }));

    connect(): void {
        if (this.isConnected()) return;
        this.isConnected.set(true);

        const timerId = setInterval(() => {
            const current = this.liveTotal();
            if (current < 1_000_000) {
                this.liveTotal.set(Math.min(1_000_000, current + 1000));
            } else {
                clearInterval(timerId);
            }
        }, 1000);

        this.destroyRef.onDestroy(() => clearInterval(timerId));
    }

    onPageChange(event: PageChangeEvent): void {
        this.skip.set(event.skip);
    }

    trackById = (_index: number, item: any): any => item?.id ?? _index;
}
