import { describe, it, expect } from "vitest";
import { formatFileSize, formatDate, getFileTypeLabel } from "./format";

describe("formatFileSize", () => {
  it("formats bytes", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(1023)).toBe("1023 B");
  });

  it("formats kilobytes", () => {
    expect(formatFileSize(1024)).toBe("1.0 KB");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(340 * 1024)).toBe("340.0 KB");
  });

  it("formats megabytes", () => {
    expect(formatFileSize(1024 * 1024)).toBe("1.0 MB");
    expect(formatFileSize(1.2 * 1024 * 1024)).toBe("1.2 MB");
    expect(formatFileSize(2048000)).toBe("2.0 MB");
  });

  it("formats gigabytes", () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe("1.0 GB");
    expect(formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe("2.5 GB");
  });
});

describe("formatDate", () => {
  it("formats ISO date string", () => {
    const result = formatDate("2026-03-28T10:00:00Z");
    expect(result).toBe("Mar 28, 2026");
  });

  it("formats another date", () => {
    const result = formatDate("2025-01-15T08:30:00Z");
    expect(result).toBe("Jan 15, 2025");
  });

  it("formats December date", () => {
    const result = formatDate("2024-12-01T00:00:00Z");
    expect(result).toBe("Dec 1, 2024");
  });
});

describe("getFileTypeLabel", () => {
  it("returns label for common image types", () => {
    expect(getFileTypeLabel("jpg")).toBe("JPEG Image");
    expect(getFileTypeLabel("jpeg")).toBe("JPEG Image");
    expect(getFileTypeLabel("png")).toBe("PNG Image");
    expect(getFileTypeLabel("gif")).toBe("GIF Image");
    expect(getFileTypeLabel("webp")).toBe("WebP Image");
    expect(getFileTypeLabel("svg")).toBe("SVG Image");
    expect(getFileTypeLabel("bmp")).toBe("BMP Image");
    expect(getFileTypeLabel("avif")).toBe("AVIF Image");
  });

  it("returns label for HEIC types", () => {
    expect(getFileTypeLabel("heic")).toBe("HEIC Image");
    expect(getFileTypeLabel("heif")).toBe("HEIF Image");
  });

  it("returns label for document types", () => {
    expect(getFileTypeLabel("pdf")).toBe("PDF Document");
    expect(getFileTypeLabel("txt")).toBe("Text File");
    expect(getFileTypeLabel("md")).toBe("Markdown");
    expect(getFileTypeLabel("json")).toBe("JSON File");
    expect(getFileTypeLabel("csv")).toBe("CSV File");
  });

  it("returns label for code types", () => {
    expect(getFileTypeLabel("js")).toBe("JavaScript");
    expect(getFileTypeLabel("ts")).toBe("TypeScript");
    expect(getFileTypeLabel("html")).toBe("HTML");
    expect(getFileTypeLabel("css")).toBe("CSS");
  });

  it("handles uppercase extensions", () => {
    expect(getFileTypeLabel("JPG")).toBe("JPEG Image");
    expect(getFileTypeLabel("HEIC")).toBe("HEIC Image");
  });

  it("returns generic label for unknown extensions", () => {
    expect(getFileTypeLabel("xyz")).toBe("XYZ File");
    expect(getFileTypeLabel("")).toBe("File");
  });
});
