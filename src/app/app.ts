import { Component } from "@angular/core";
import { LiveGrid } from "./components/live-grid/live-grid";

@Component({
  selector: "app-root",
  imports: [LiveGrid],
  templateUrl: "./app.html",
})
export class App { }
