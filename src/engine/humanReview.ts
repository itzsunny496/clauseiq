import type { ReviewableItem, ReviewStatus, ReviewSource, SessionStats } from "../types";
import { nanoid } from "../utils/nanoid";

export function wrap<T>(value: T, source: ReviewSource, confidence = 0.7): ReviewableItem<T> {
  return { id: nanoid(), value, aiConfidence: confidence, status: "pending", source };
}

export function accept<T>(item: ReviewableItem<T>): ReviewableItem<T> {
  return { ...item, status: "accepted", reviewedAt: new Date() };
}

export function edit<T>(item: ReviewableItem<T>, correctedValue: T): ReviewableItem<T> {
  return { ...item, status: "edited", correctedValue, reviewedAt: new Date() };
}

export function reject<T>(item: ReviewableItem<T>): ReviewableItem<T> {
  return { ...item, status: "rejected", reviewedAt: new Date() };
}

export function effectiveValue<T>(item: ReviewableItem<T>): T {
  return item.status === "edited" && item.correctedValue !== undefined ? item.correctedValue : item.value;
}

export function computeStats(items: ReviewableItem<unknown>[]): SessionStats {
  const total = items.length;
  if (total === 0) return { total: 0, accepted: 0, edited: 0, rejected: 0, pending: 0, correctionRate: 0 };
  const accepted = items.filter((i) => i.status === "accepted").length;
  const edited = items.filter((i) => i.status === "edited").length;
  const rejected = items.filter((i) => i.status === "rejected").length;
  const pending = items.filter((i) => i.status === "pending").length;
  const correctionRate = total > 0 ? Math.round(((edited + rejected) / total) * 1000) / 10 : 0;
  return { total, accepted, edited, rejected, pending, correctionRate };
}
