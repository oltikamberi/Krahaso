import type { SiteAdapter } from "../types.js";
import { demoAdapter } from "./demo.js";
// import { gjirafa50Adapter } from "./gjirafa50.js";

/**
 * All active adapters. To add a new retailer: write one adapter file
 * implementing SiteAdapter and register it here.
 *
 * gjirafa50Adapter is a skeleton — enable it after verifying its selectors
 * against the live site (and checking robots.txt / terms of service).
 */
export const adapters: SiteAdapter[] = [
  demoAdapter,
  // gjirafa50Adapter,
];
