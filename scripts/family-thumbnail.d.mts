// The types of family-thumbnail.mjs, for packages whose scripts are TypeScript. The same file in every package.
import type { Buffer } from "node:buffer";
import type { Page } from "@playwright/test";

export interface PackageJson {
  name: string;
  description?: string;
  repository?: string | { url?: string };
}
/** A Playwright page (the package's own Playwright). */
export type PageLike = Page;

export const FAMILY_THUMBNAIL_VERSION: string;
export const THUMBNAILS: { file: string; width: number; height: number; scheme: "light" | "dark"; budget: number }[];
export const THUMBNAIL_FILES: string[];
export const GROUNDS: Record<"light" | "dark", { ground: string; ink: string }>;
export const LEADING_THUMBNAIL: RegExp;
export function repositoryOf(pkg: PackageJson): { owner: string; repo: string };
export function thumbnailAddresses(pkg: PackageJson): {
  site: string;
  card: string;
  dark: string;
  icon: string;
  raw: { card: string; dark: string; icon: string };
};
export function defaultAlt(pkg: PackageJson): string;
export const RELATIVE_BASE: RegExp;
export function thumbnailHead(pkg: PackageJson, options?: { alt?: string; base?: string; icon?: boolean }): string;
export function thumbnailReadmeBlock(pkg: PackageJson, options?: { alt?: string }): string;
export function readmeThumbnailFaults(readme: string, pkg: PackageJson): string[];
export function pngSize(bytes: Buffer): { width: number; height: number } | null;
export function thumbnailFaults(root?: string): string[];
export function publishThumbnails(root: string, siteDir: string): void;
export function captureDrawing(
  page: PageLike,
  selector: string,
  options?: { clear?: boolean; margin?: number },
): Promise<Buffer>;
export function composeOne(
  page: PageLike,
  drawing: Buffer,
  options: { width: number; height: number; scheme: "light" | "dark"; label?: string; pad?: number; grow?: number },
): Promise<Buffer>;
export function composeThumbnails(options: {
  page: PageLike;
  root?: string;
  light: Buffer;
  dark: Buffer;
  icon?: Buffer;
  label?: string;
  pad?: number;
  iconPad?: number;
  grow?: number;
}): Promise<{ file: string; bytes: number }[]>;
