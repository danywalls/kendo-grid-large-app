# Implementation Feedback — test.md (Updated)

## Issues Found During Implementation (Angular 21.1.5 + Kendo UI Grid 23.1.0)

### 1. ✅ FIXED — `resource()` API uses `params` not `request` (Angular 21)
**Location:** LiveGrid component code block (live-grid.ts)

Angular 21 renamed the `resource()` options:
- `request:` → `params:`
- `loader: ({ request })` → `loader: ({ params })`

Already fixed in both the project and `test.md`.

---

### 2. ❌ `[trackBy]` causes NG0955 duplicate key errors + crashes
**Location:** LiveGrid template and component

**Error:**
```
NG0955: The provided track expression resulted in duplicated keys for a given collection.
Duplicated keys were: key "" at index "0" and "1", key "" at index "1" and "2", ...
```

Plus repeated:
```
TypeError: Cannot read properties of undefined (reading 'index')
```

**Root Cause:** Kendo Grid v23's `[trackBy]` does not work correctly with Angular 21. The `TrackByFunction<GridItem>` signature is incompatible. The trackBy function receives Kendo's internal `GridItem` wrapper objects, not the raw `Viewer` data — and those wrapper objects don't have an `id` property, resulting in all keys being `""`.

**Fix:** Remove `[trackBy]` entirely from the template and `trackById` from the component. Also remove from test.md article.

**Article Impact:**
- Remove `trackById` from `live-grid.ts` code block
- Remove `[trackBy]="trackById"` from `live-grid.html` code block  
- Remove the explanation paragraph about `[trackBy]` in the article text
- Remove `Viewer` import since it was only used for trackById typing

---

### 3. ❌ Server-side virtual scrolling has scroll height limited to loaded rows
**Location:** Runtime behavior

**Symptom:** After connecting, `scrollHeight` is only 3600px (100 rows × 36px) instead of 36,000,000px (1M rows × 36px). The grid only shows the first 100 rows and doesn't create a virtual scrollbar for 1M rows.

**Root Cause:** There are repeated `TypeError: Cannot read properties of undefined (reading 'index')` errors (35+ times) coming from inside Kendo Grid. These appear to be a **compatibility issue between Kendo UI Grid v23.1.0 and Angular 21.1.5**. The errors prevent the grid from properly initializing the virtual scroll area with the `total` from `GridDataResult`.

**Status:** This appears to be a Kendo Grid bug or Angular 21 incompatibility. The grid works for displaying data but virtual scrolling pagination (fetching new pages on scroll) doesn't work because the scrollbar height isn't calculated from the `total` property.

**Possible workarounds to investigate:**
- Check if a newer version of Kendo UI Grid supports Angular 21
- Try using a different approach to virtual scrolling (e.g., client-side with all data loaded)
- File a bug report with Progress/Telerik

---

### 4. ⚠️ `ng new` interactive AI tools prompt
Angular 21 CLI prompts about AI tool configurations. Use `--defaults` to skip.

---

### 5. ✅ Working correctly
- ViewerService with async `fetchPage()` ✅
- `resource()` with `params`/`loader` ✅
- `OnPush` change detection ✅
- Client-side virtual scrolling (from earlier section) ✅
- Grid displays data after connect ✅
