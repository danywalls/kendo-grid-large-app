# Angular Grid at Scale: How Kendo UI Handles Millions of Rows

The Super Bowl just ended, and over **120 million people** watched it. Now imagine this: your boss walks in on Monday morning and says: _"Dany, great game, right? Now, I need a dashboard. I want to see every connected viewer in real time. A grid. Sortable. Filterable. And it can't be slow."_

You open your code editor, create a simple HTML table, and try to render one million rows. The browser freezes. The tab crashes. Your Monday just got worse.

But here's the catch: how do we handle this massive amount of data without freezing the user's screen? The solution is simple: don't render what the user can't see. 

This is where **virtual scrolling** comes in. Think of it as a "window": instead of creating a DOM element for every single row, we only render the ones visible on the screen. This way, the user scrolls smoothly through millions of records, while the browser stays fast and responsive.

Today, we'll build this **Super Bowl Viewers Dashboard** in Angular that handles one million connected viewers using [Kendo UI for Angular Grid](https://www.telerik.com/kendo-angular-ui/components/grid/). We'll start simple, see the problem, and fix it step-by-step with virtual scrolling and modern Angular **Signals**.

Let's make this work in a real project!

---

## 🏗️ Setting Up the Project

First, create a new Angular application:

```bash
ng new superbowl-dashboard
cd superbowl-dashboard
```

Now install the Kendo UI Grid. The `ng add` command handles dependencies and theme configuration for us:

```bash
ng add @progress/kendo-angular-grid --skip-confirmation
```

### Adjusting the Budgets
Because Kendo UI Grid is a robust enterprise library, it includes many powerful features. To prevent Angular from throwing a "budget exceeded" error, open your `angular.json` file and increase the `budgets` config for the `initial` type:

```json
"budgets": [
  {
    "type": "initial",
    "maximumWarning": "5MB",
    "maximumError": "10MB"
  }
]
```

---

## 🛠️ Our Data Engine

Before we build the UI, we need a way to simulate our data. We'll create a single service that handles both generating mock users and simulating a live API feed. This keeps our project clean and easy to manage.

**Run this command:**
```bash
ng g s services/viewer --skip-tests
```

Open `src/app/services/viewer.service.ts` and add the following:

```typescript
import { Injectable } from "@angular/core";

export interface Viewer {
  id: number;
  username: string;
  watchTimeMin: number;
  isLive: boolean;
}

const ADJECTIVES = ["Swift", "Lucky", "Bold", "Chill", "Epic", "Wild", "Cool", "Fast"];
const NOUNS = ["Fan", "Eagle", "Tiger", "Bear", "Wolf", "Hawk", "Fox", "Shark"];

@Injectable({ providedIn: "root" })
export class ViewerService {
  /**
   * Generates a list of viewers locally.
   * Perfect for showing the fundamentals of virtualization.
   */
  getViewers(count: number, startId = 0): Viewer[] {
    return Array.from({ length: count }, (_, i) => ({
      id: startId + i + 1,
      username: `${this.random(ADJECTIVES)}${this.random(NOUNS)}${Math.floor(Math.random() * 9999)}`,
      watchTimeMin: Math.floor(Math.random() * 240) + 1,
      isLive: Math.random() > 0.08,
    }));
  }

  /**
   * Simulates an API call with a network delay.
   * This is how we scale to millions of rows safely.
   */
  async fetchPage(skip: number, take: number, abortSignal?: AbortSignal): Promise<Viewer[]> {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, 80); // Simulate network lag
      abortSignal?.addEventListener("abort", () => {
        clearTimeout(timeout);
        reject(new DOMException("Aborted", "AbortError"));
      });
    });
    return this.getViewers(take, skip);
  }

  private random(arr: string[]): string {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}
```

---

## The Problem: Rendering All Rows at Once

Let's try to do it and experience the problem first-hand. Open `src/app/app.ts` and replace its content to load **all the data at once**.

To get started, we'll need to include `KENDO_GRID` in our `@Component` imports array so we can use the grid tags.

```typescript
import { Component, inject, signal } from "@angular/core";
import { KENDO_GRID } from "@progress/kendo-angular-grid";
import { ViewerService, Viewer } from "./services/viewer.service";

@Component({
  selector: "app-root",
  imports: [KENDO_GRID],
  templateUrl: "./app.html", 
})
export class App {
  private service = inject(ViewerService);
  viewers = signal<Viewer[]>([]);

  loadViewers(count: number): void {
    const data = this.service.getViewers(count);
    this.viewers.set(data);
  }
}
```

Now, let's open our template file, `src/app/app.html` and add a few buttons for 1K, 10K, and 100K viewers. These buttons will call our `loadViewers()` method to quickly generate different amounts of fake data. 

Finally, we'll use the `<kendo-grid>` component in our template. The key property to pay attention to is `[data]="viewers()"`, which tells Kendo UI to read from our reactive signal and constantly display the list of viewers.

```html
<h1>Super Bowl Viewers Dashboard</h1>
<p>Connected viewers: {{ viewers().length.toLocaleString() }}</p>

<div class="actions">
  <button (click)="loadViewers(1_000)">1K Viewers</button>
  <button (click)="loadViewers(10_000)">10K Viewers</button>
  <button (click)="loadViewers(100_000)">100K Viewers</button>
</div>

<kendo-grid [data]="viewers()" [height]="600">
  <kendo-grid-column field="id" title="#" [width]="70"></kendo-grid-column>
  <kendo-grid-column
    field="username"
    title="Username"
    [width]="180"
  ></kendo-grid-column>
  <kendo-grid-column
    field="watchTimeMin"
    title="Watch (min)"
    [width]="110"
  ></kendo-grid-column>
  <kendo-grid-column
    field="isLive"
    title="Live"
    [width]="70"
  ></kendo-grid-column>
</kendo-grid>
```

Now we can run our app. Go to your terminal and execute the following command:

```bash
ng serve
```

This will start the local development server. Once it finishes compiling, open your browser and navigate to `http://localhost:4200`.

Click **"1K Viewers"** and it feels smooth. Click **"10K Viewers"** and you will notice a small delay. Now click **"100K Viewers"**... and watch your browser struggle. The page might freeze for several seconds.

**Why does this happen?** Because the grid creates a DOM element for **every single row**. With 100,000 rows and 4 columns, that's **400,000 DOM nodes**. No browser handles that well. Now imagine doing this with the Super Bowl's 120 million viewers. Not going to happen.

We have seen the exact problem: creating too many HTML elements freezes the browser. Now, let's fix it by rendering only the visible rows. This is where [virtual scrolling](https://www.telerik.com/kendo-angular-ui/components/grid/scroll-modes/virtual) comes to the rescue.

## Virtual Scrolling

Think of virtual scrolling as a camera moving over a huge stadium. You can only see the seats in your frame, maybe 50 at a time. But the stadium has 100,000 seats. The camera doesn't need to _build_ all 100,000 seats to show you the ones in frame. It just renders what's visible and swaps them out as you move.

Kendo UI Grid does exactly this with one simple property: `scrollable="virtual"`.

Update your `src/app/app.html` to include the virtual scrolling properties:

```html
<h1>Super Bowl Viewers Dashboard</h1>
<p>Connected viewers: {{ viewers().length.toLocaleString() }}</p>

<div class="actions">
  <button (click)="loadViewers(10_000)">10K</button>
  <button (click)="loadViewers(100_000)">100K</button>
</div>

<kendo-grid
  [data]="viewers()"
  [height]="600"
  scrollable="virtual"
  [rowHeight]="36"
  [pageSize]="50"
>
  <kendo-grid-column field="id" title="#" [width]="70"></kendo-grid-column>
  <kendo-grid-column
    field="username"
    title="Username"
    [width]="180"
  ></kendo-grid-column>
  <kendo-grid-column
    field="watchTimeMin"
    title="Watch (min)"
    [width]="110"
  ></kendo-grid-column>
  <kendo-grid-column
    field="isLive"
    title="Live"
    [width]="70"
  ></kendo-grid-column>
</kendo-grid>
```

We added three key properties to the `<kendo-grid>`. First, we set `scrollable` to `"virtual"` to enable virtual scrolling, which means only the visible rows are added to the DOM. Next, we defined a `rowHeight` of `36` pixels because the grid needs a fixed height to accurately calculate scroll positions. Finally, we set the `pageSize` to `50` to define how many rows are rendered at a time. It's usually best to set your page size to at least three times the number of visible rows on the screen.

Now, if you click the buttons, you will see how it generates 10,000 or 100,000 viewers and everything scrolls **smoothly**. The browser doesn't freeze because only ~50 rows exist in the DOM at any time.

That's it. Three properties, and your Super Bowl dashboard now renders large datasets gracefully.

But wait. We have solved the rendering issue, but what about the data itself? Right now, we are generating all the data in the browser's memory. In a real application, you shouldn't load millions of records into your user's RAM at once.

Even worse! What if this data is a live feed from the Super Bowl stream and we want to monitor one million concurrent users in real-time? Let's take it to the next level and implement server-side data fetching.

## 🚀 Scaling to a Live API (1,000,000 rows)

Now, let's go for the gold. We'll simulate a real-time feed that keeps growing until it reaches **one million viewers**.

We'll build a separate component to keep our project organized. **So far we've done the setup, now let's move to the real-time logic.**

**Run this command:**
```bash
ng g c components/live-grid
```

### High-Performance Dashboard Logic

Open `src/app/components/live-grid/live-grid.ts`. We'll use the modern Angular **Resource API** to fetch data on demand and a **Smooth Transition** pattern. 

**Why do we need this step?** If we didn't use an internal signal to hold the data, the grid would flicker every time you scroll. This way, the user always sees rows while the next page is loading.

```typescript
import { Component, inject, signal, computed, resource, effect, untracked, DestroyRef, ChangeDetectionStrategy } from "@angular/core";
import { KENDO_GRID, PageChangeEvent, GridDataResult } from "@progress/kendo-angular-grid";
import { ViewerService } from "../../services/viewer.service";

@Component({
  selector: "app-live-grid",
  imports: [KENDO_GRID],
  templateUrl: "./live-grid.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`:host ::ng-deep .k-grid-table tr { height: 36px; }`]
})
export class LiveGrid {
  private service = inject(ViewerService);
  private destroyRef = inject(DestroyRef);

  skip = signal(0);
  isConnected = signal(false);
  liveTotal = signal(0);
  readonly pageSize = 100;

  // Modern Resource API: fetches data automatically whenever skip changes
  viewersResource = resource({
    params: () => ({ skip: this.skip(), isConnected: this.isConnected() }),
    loader: async ({ params, abortSignal }) => {
      if (!params.isConnected) return [];
      return this.service.fetchPage(params.skip, this.pageSize, abortSignal);
    },
  });

  private gridData = signal<any[]>([]);

  constructor() {
    // Smooth Transition pattern: preserve data while loading
    effect(() => {
      const value = this.viewersResource.value();
      if (value !== undefined) {
        untracked(() => this.gridData.set(value));
      }
    });
  }

  // Combine our live counter with our current data page
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
```

---

## 🏁 Wrap-up

**So, what have we built?**
1. We identified the main pain point: rendering massive datasets crashes the browser.
2. We fixed it instantly with **Virtual Scrolling**.
3. We scaled to **one million rows** using a consolidated service and modern Angular **Signals**.

The Kendo UI Grid handles the complexity of virtualization, while Angular's latest APIs (Resource and Signals) keep our data flow clean and efficient. This is how you build enterprise-ready dashboards that scale without friction.

**Ready for a challenge?**
* **Try this:** Add sorting or filtering to the `ViewerService` to make the grid even more powerful.
* **Go deeper:** Use the [Kendo UI ThemeBuilder](https://themebuilder.telerik.com/) to style the dashboard for a specific brand.
* **Extend it:** Connect the pattern to an actual backend API using `HttpClient`.

Happy coding!
