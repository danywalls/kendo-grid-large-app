## Angular Grid at Scale: How Kendo UI Handles Millions of Rows.

The Super Bowl just happened, and over 120 million people watched it. Now imagine this: your boss walks in on Monday morning and says, "We need a dashboard that shows every connected viewer in real time. A grid. Sortable. Filterable. And it can't be slow."

You open your code editor, create an HTML table, and try to render one million rows. The browser freezes. The tab crashes. Your Monday just got worse.

We need to display large amounts of data in a grid without killing the browser. The trick is simple: don't render what the user can't see.

This is where **virtual scrolling** comes in. Instead of creating a DOM element for every single row, we only render the rows visible on screen, plus a small extra. The user scrolls smoothly through millions of records, and the browser stays fast and responsive.

Today, we'll build a Super Bowl Viewers Dashboard in Angular that handles ne million connected viewers using [Kendo UI for Angular Grid](https://www.telerik.com/kendo-angular-ui/components/grid/). We'll start simple, see the problem, and fix it step by step with virtual scrolling and server-side data fetching.

Let's make this work in a real project.

## Setting Up the Project

First, create a new Angular application by running the command `ng new superbowl-dashboard`:

```bash
ng new superbowl-dashboard
```

Navigate to the project:

```bash
cd superbowl-dashboard
```

Now install the Kendo UI Grid. The `ng add` command handles dependencies and theme configuration for us:

```bash
ng add @progress/kendo-angular-grid --skip-confirmation
```

This installs the grid package, its peer dependencies, and sets up the Kendo UI default theme.

Once the installation is done, you need to activate your Kendo UI license. This step removes the watermark and unlocks all the features.

> Don't have a license? Don't worry! You can get a [completely free trial](https://www.telerik.com/try/kendo-ui) with **no credit card required**, so you can follow along and build the dashboard without worrying about the watermark.

To do this, download your license key file from your Telerik account. Then, run this command inside your project folder:

```bash
npx kendo-ui-license activate
```


Because Kendo UI Grid is a robust enterprise library, it includes many features that can slightly increase your initial bundle size. To prevent Angular from throwing a "bundle initial exceeded maximum budget" error when you run or build your app, open your `angular.json` file and increase the `budgets` config for the `initial` type to around `5MB` for warnings and `10MB` for errors.

Perfect! we have a fresh Angular project with Kendo UI Grid installed and styled. Now let's generate our Super Bowl viewers fake data.

## Generating One Million Viewers

Before we start with the grid, we need data. We'll create a single service that handles everything: generating fake viewer data for client-side demos and simulating a paginated server API for server-side scrolling.

To create the service, open your terminal and run the following Angular CLI command:

```bash
ng g s services/viewer
```


First, we will define a simple `Viewer` interface so our grid knows what fields to expect. Then, our service will include a `generateViewers` method to create mock data, and a `fetchPage` method that simulates a paginated server API. We won't use `fetchPage` right away, but it will be ready for when we implement server-side virtual scrolling later.

Don't worry too much about the exact implementation of the helper methods; the main idea here is not how to generate fake users, but how to create a Grid capable of supporting massive amounts of data without breaking a sweat!

Open `src/app/services/viewer.ts` and add the following:

```typescript
import { Injectable } from "@angular/core";

export interface Viewer {
  id: number;
  username: string;
  watchTimeMin: number;
  isLive: boolean;
}

export interface PagedResult {
  data: Viewer[];
  total: number;
}

const ADJECTIVES = [
  "Swift",
  "Lucky",
  "Bold",
  "Chill",
  "Epic",
  "Happy",
  "Lazy",
  "Wild",
  "Cool",
  "Fast",
];

const NOUNS = [
  "Fan",
  "Eagle",
  "Tiger",
  "Bear",
  "Wolf",
  "Hawk",
  "Fox",
  "Lion",
  "Shark",
  "Bull",
];

@Injectable({ providedIn: "root" })
export class ViewerService {
  private readonly TOTAL_VIEWERS = 1_000_000;

  generateViewers(count: number): Viewer[] {
    const viewers: Viewer[] = [];

    for (let i = 0; i < count; i++) {
      viewers.push({
        id: i + 1,
        username: `${this.randomFrom(ADJECTIVES)}${this.randomFrom(NOUNS)}${this.randomBetween(1, 9999)}`,
        watchTimeMin: this.randomBetween(1, 240),
        isLive: Math.random() > 0.08,
      });
    }

    return viewers;
  }

  /**
   * Simulates a server API call with pagination.
   * Uses a small delay to mimic real network latency.
   */
  async fetchPage(skip: number, take: number): Promise<PagedResult> {
    await new Promise((resolve) => setTimeout(resolve, 80));

    return {
      data: this.generateViewers(take),
      total: this.TOTAL_VIEWERS,
    };
  }

  private randomFrom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
```

Each viewer has a fun auto-generated username (like `SwiftEagle4821`), their watch time, and live status. The `fetchPage` method is an `async` function that simulates a paginated API with a small delay to mimic network latency. We'll use `generateViewers` first and come back to `fetchPage` later.

With our service ready, let's see what happens when we try to render all these viewers at once.

## The Problem: Rendering All Rows at Once

Let's try to do it and experience the problem first-hand. Open `src/app/app.ts` and replace its content to load **all the data at once**.

To get started, we'll need to include `KENDO_GRID` in our `@Component` imports array so we can use the grid tags.

```typescript
import { Component, inject, signal } from "@angular/core";
import { KENDO_GRID } from "@progress/kendo-angular-grid";
import { ViewerService, Viewer } from "./services/viewer";

@Component({
  selector: "app-root",
  imports: [KENDO_GRID],
  templateUrl: "./app.html", 
})
export class App {
  private viewerService = inject(ViewerService);
  viewers = signal<Viewer[]>([]);

  loadViewers(count: number): void {
    const data = this.viewerService.generateViewers(count);
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

## The Solution: Virtual Scrolling

Think of virtual scrolling as a camera moving over a huge stadium. You can only see the seats in your frame, maybe 50 at a time. But the stadium has 100,000 seats. The camera doesn't need to _build_ all 100,000 seats to show you the ones in frame. It just renders what's visible and swaps them out as you move.

Kendo UI Grid does exactly this with one simple property: `scrollable="virtual"`.

Update your `app.ts` (or `app.component.ts`):

```typescript
import { Component, inject, signal } from "@angular/core";
import { KENDO_GRID } from "@progress/kendo-angular-grid";
import { ViewerService, Viewer } from "./services/viewer";

@Component({
  selector: "app-root",
  imports: [KENDO_GRID],
  templateUrl: "./app.html", 
})
export class App {
  private viewerService = inject(ViewerService);
  viewers = signal<Viewer[]>([]);

  loadViewers(count: number): void {
    const data = this.viewerService.generateViewers(count);
    this.viewers.set(data);
  }
}
```

Then, update your `src/app/app.html` (or `src/app/app.component.html`) to include the virtual scrolling properties:

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



We added three key properties to the `<kendo-grid>`. First, we set `scrollable` to `"virtual"` to enable virtual scrolling, which means only the visible rows are added to the DOM. Next, we defined a `rowHeight` of `36` pixels because the grid needs a fixed height to accurately calculate scroll positions. It is important to keep this value consistent and avoid placing content inside the grid cells that could make the rows expand to different sizes, since virtual scrolling relies on this. Finally, we set the `pageSize` to `50` to define how many rows are rendered at a time. A good rule of thumb: set your page size to at least **three times** the number of visible rows on the screen. If your grid shows around 15 rows, a `pageSize` of 50 is a solid default. Too small and you'll see flickering; too large and you lose the benefits of virtualization.

Now, if you click the buttons, you will see how it generates 10,000 or 100,000 viewers and everything scrolls **smoothly**. The browser doesn't freeze because only ~50 rows exist in the DOM at any time.

That's it. Three properties, and your Super Bowl dashboard now renders large datasets gracefully.

But wait. We have solved the rendering issue, but what about the data itself? Right now, we are generating all the data in the browser's memory. In a real application, you shouldn't load millions of records into your user's RAM at once.

Even worse! What if this data is a live feed from the Super Bowl stream and we want to monitor one million concurrent users in real-time? Let's take it to the next level and implement server-side data fetching.

## Server-Side Data Fetching with Endless Scrolling

Here's the reality: the Super Bowl has **120 million viewers**. You can't load all of them into the browser at once. Instead, the grid should fetch data page by page as the user scrolls — loading only what's needed, when it's needed.

Kendo UI Grid supports this out of the box with the [`(scrollBottom)`](https://www.telerik.com/kendo-angular-ui/components/grid/api/gridcomponent#scrollbottom) event. When the user scrolls to the bottom of the current data, the grid fires this event, and we simply fetch the next page and append it. Combined with the virtual scrolling we already set up, this creates a seamless experience: the grid renders only visible rows while continuously loading more data in the background.

Let's build it. Generate a new component:

```bash
ng g c components/live-grid
```

Open `src/app/components/live-grid/live-grid.ts` and replace the content with:

```typescript
import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
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

  viewers = signal<Viewer[]>([]);
  loading = signal(false);
  isConnected = signal(false);

  readonly pageSize = 1_000;

  total = computed(() => this.viewers().length);

  async connect(): Promise<void> {
    this.isConnected.set(true);
    await this.loadNextPage();
  }

  async loadNextPage(): Promise<void> {
    if (this.loading()) return;

    this.loading.set(true);
    const result = await this.viewerService.fetchPage(
      this.viewers().length,
      this.pageSize,
    );
    this.viewers.update((current) => [...current, ...result.data]);
    this.loading.set(false);
  }
}
```

Now the template in `src/app/components/live-grid/live-grid.html`:

```html
<h2>Live Server Feed</h2>
<p>
  Viewers loaded: {{ total().toLocaleString() }}
</p>

<button (click)="connect()">Connect to Live Feed</button>

@if (isConnected()) {
<kendo-grid
  [data]="viewers()"
  [height]="600"
  scrollable="virtual"
  [rowHeight]="36"
  [loading]="loading()"
  (scrollBottom)="loadNextPage()"
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
}
```

Wire the component into the app. Update `app.ts`:

```typescript
import { Component } from "@angular/core";
import { LiveGrid } from "./components/live-grid/live-grid";

@Component({
  selector: "app-root",
  imports: [LiveGrid],
  templateUrl: "./app.html",
})
export class App {}
```

And `src/app/app.html`:

```html
<h1>Super Bowl Viewers Dashboard</h1>
<app-live-grid />
```

Run `ng serve`, open `http://localhost:4200`, and click **"Connect to Live Feed"**. You'll see the grid load the first 1,000 viewers. Now scroll down — when you reach the bottom, the grid fetches the next 1,000 viewers and appends them. The loading skeleton appears briefly while data is being fetched. Keep scrolling and watch the "Viewers loaded" counter grow.

The implementation is simple:

- **`connect()`** sets `isConnected` to `true` and loads the first page.
- **`(scrollBottom)`** fires whenever the user scrolls to the end of the loaded data. We call `loadNextPage()`, which fetches the next batch and appends it to the existing `viewers` signal using `.update()`.
- **`scrollable="virtual"`** ensures only the visible rows (~16) are in the DOM at any time, no matter how many thousands of viewers we've loaded.
- **`[loading]`** shows Kendo Grid's built-in loading skeleton while a fetch is in progress.
- **`ChangeDetectionStrategy.OnPush`** prevents unnecessary re-renders — since we use Signals exclusively, Angular only updates the view when signal values change.

This is the core pattern for handling large datasets: virtual scrolling handles the rendering, and endless scrolling handles the data loading. The grid never holds more than what the user has scrolled through, and the DOM never holds more than what's visible.

## Recap: What We Built

Let's review what we accomplished with our Super Bowl Viewers Dashboard:

First, we saw **the problem**: rendering tens of thousands of rows at once freezes the browser. Then we added **row virtualization** with `scrollable="virtual"` — the key to rendering only visible rows and handling large datasets without crashing.

Finally, we combined virtual scrolling with **server-side data fetching** using the `(scrollBottom)` event. The grid loads data page by page as the user scrolls, keeping memory usage low while providing a smooth, endless scrolling experience.

We built everything using **Angular Signals** — `signal()`, `computed()`, and `update()` — for a clean, modern, reactive architecture with `OnPush` change detection.

The Kendo UI Grid does the heavy lifting. A few properties, one event, and your dashboard handles **millions of rows** without breaking a sweat.

Happy coding!
