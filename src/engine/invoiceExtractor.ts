import type { InvoiceField, ConfidenceLevel } from "../types";
import { wrap } from "./humanReview";
import { extractDays } from "./regexUtils";
import { nanoid } from "../utils/nanoid";

interface ExtractedDate { date: Date | null; raw: string }

function parseDate(raw: string): Date | null {
  if (!raw) return null;
  // dd/mm/yyyy or dd-mm-yyyy
  const dmy = raw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmy) return new Date(+dmy[3], +dmy[2] - 1, +dmy[1]);
  // yyyy-mm-dd
  const ymd = raw.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymd) return new Date(+ymd[1], +ymd[2] - 1, +ymd[3]);
  return null;
}

function field(key: string, label: string, value: string, confidence: ConfidenceLevel, snippet: string): InvoiceField {
  return { key, label, value: wrap(value, "invoice-extractor", confidence === "high" ? 0.9 : confidence === "medium" ? 0.65 : 0.4), confidence, snippet, entities: [] };
}

function extract(pattern: RegExp, text: string): { value: string; snippet: string; conf: ConfidenceLevel } | null {
  const m = text.match(pattern);
  if (!m) return null;
  const value = (m[2] ?? m[1] ?? "").trim();
  return { value, snippet: m[0], conf: "high" };
}

export function extractInvoiceFields(text: string): { fields: InvoiceField[]; msmedViolation: boolean; paymentDays: number | null; invoiceDate: Date | null; dueDate: Date | null } {
  const fields: InvoiceField[] = [];

  // Vendor / Supplier name
  const vendorM = text.match(/(?:from|vendor|supplier|seller|billed?\s+(?:from|by))[:\s]+([A-Za-z][A-Za-z0-9\s&.,''()-]{2,50})/i)
    || text.match(/^([A-Z][A-Za-z0-9\s&.,''()-]{2,50})\n/m);
  fields.push(field("vendor", "Vendor / Supplier", vendorM?.[1]?.trim() ?? "Not detected", vendorM ? "high" : "low", vendorM?.[0] ?? ""));

  // Invoice number
  const invNoM = extract(/invoice\s*(?:no\.?|number|#|num)[:\s#]+(\S{3,20})/i, text);
  fields.push(field("invoiceNo", "Invoice No.", invNoM?.value ?? "Not detected", invNoM?.conf ?? "low", invNoM?.snippet ?? ""));

  // Invoice date
  const invDateM = extract(/invoice\s+date[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i, text)
    ?? extract(/date\s+of\s+invoice[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i, text);
  const invoiceDate = parseDate(invDateM?.value ?? "");
  fields.push(field("invoiceDate", "Invoice Date", invDateM?.value ?? "Not detected", invDateM?.conf ?? "low", invDateM?.snippet ?? ""));

  // Due date
  const dueDateM = extract(/due\s+date[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i, text)
    ?? extract(/payment\s+due[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i, text);
  const dueDate = parseDate(dueDateM?.value ?? "");
  fields.push(field("dueDate", "Due Date", dueDateM?.value ?? "Not detected", dueDateM?.conf ?? "low", dueDateM?.snippet ?? ""));

  // Payment terms (days)
  const termsM = extract(/(?:payment\s+terms?|net)\s*:?\s*(\d+\s*days?)/i, text);
  if (termsM) fields.push(field("paymentTerms", "Payment Terms", termsM.value, "high", termsM.snippet));

  // GST amount
  const gstM = extract(/(?:gst|igst|cgst|sgst)\s*(?:@\s*\d+%\s*)?[:\s]+(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i, text);
  fields.push(field("gstAmount", "GST Amount", gstM ? `₹${gstM.value}` : "Not detected", gstM?.conf ?? "low", gstM?.snippet ?? ""));

  // GSTIN
  const gstinM = extract(/gstin[:\s]+(\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d])/i, text);
  if (gstinM) fields.push(field("gstin", "GSTIN", gstinM.value, "high", gstinM.snippet));

  // Total payable
  const totalM = extract(/(?:total\s+(?:payable|amount|due|invoice\s+value)|grand\s+total)[:\s]+(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i, text)
    ?? extract(/(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:only|\/[-])?$/m, text);
  fields.push(field("totalPayable", "Total Payable", totalM ? `₹${totalM.value}` : "Not detected", totalM?.conf ?? "low", totalM?.snippet ?? ""));

  // MSMED check
  let paymentDays: number | null = null;
  if (invoiceDate && dueDate) {
    paymentDays = Math.round((dueDate.getTime() - invoiceDate.getTime()) / 86400000);
  } else if (termsM) {
    paymentDays = extractDays(termsM.value);
  }
  const msmedViolation = paymentDays !== null && paymentDays > 45;

  if (msmedViolation) {
    fields.unshift(field("msmedFlag", "MSMED Compliance", `⚠ Payment term of ${paymentDays} days EXCEEDS 45-day MSMED Act limit — interest accrues at 3× RBI Bank Rate`, "high", ""));
  } else if (paymentDays !== null) {
    fields.unshift(field("msmedFlag", "MSMED Compliance", `✅ Payment term of ${paymentDays} days is within the 45-day MSMED Act limit`, "high", ""));
  }

  return { fields, msmedViolation, paymentDays, invoiceDate, dueDate };
}
