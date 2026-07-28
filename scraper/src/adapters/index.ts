import type { SiteAdapter } from "../types.js";
import { aztechAdapter } from "./aztech.js";
import { butonAdapter } from "./buton.js";
// import { demoAdapter } from "./demo.js"; // offline pipeline tests only
import { gjirafa50Adapter } from "./gjirafa50.js";
import { mall75Adapter } from "./mall75.js";
import { neptunAdapter } from "./neptun.js";

export const adapters: SiteAdapter[] = [
  gjirafa50Adapter,
  neptunAdapter,
  aztechAdapter,
  butonAdapter,
  mall75Adapter,
];
