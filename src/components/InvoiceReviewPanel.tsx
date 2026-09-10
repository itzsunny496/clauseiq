import React from "react";
import { InvoiceData, ReviewStatus, ReviewableItem } from "../types";
import { ReviewControls } from "./ReviewControls";
import { DollarSign, Calendar, Building, AlertTriangle, ShieldCheck, FileText } from "lucide-react";

interface InvoiceReviewPanelProps {
  invoice: InvoiceData;
  onUpdateInvoice: (updated: InvoiceData) => void;
  reviewState: Record<string, ReviewStatus>;
  onVerify: (fieldId: string) => void;
  onReject: (fieldId: string) => void;
  onEdit: (fieldId: string, newValue: any) => void;
}

export const InvoiceReviewPanel: React.FC<InvoiceReviewPanelProps> = ({
  invoice,
  onUpdateInvoice,
  reviewState,
  onVerify,
  onReject,
  onEdit,
}) => {
  const isMsmeVendor = invoice.isMsmeVendor;
  const daysOverdue = invoice.dueDate
    ? Math.floor((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 3600 * 24))
    : 0;

  const createReviewItem = (fieldId: string, val: any): ReviewableItem<string> => ({
    id: fieldId,
    value: String(val !== undefined && val !== null ? val : ""),
    aiConfidence: 0.92,
    status: reviewState[fieldId] || "pending",
    source: "invoice-extractor",
  });

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <h3 className="text-xl font-bold text-slate-100">Invoice Intelligence Breakdown</h3>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Extracted entity data with Human-in-the-loop verification & MSMED Sec 15-16 audit.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isMsmeVendor ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> MSME Registered Vendor
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                Standard Vendor
              </span>
            )}
          </div>
        </div>

        {/* MSME Statutory Warning Banner */}
        {isMsmeVendor && (
          <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-200">MSMED Act 2006 Statutory Payment Rule Active</p>
              <p className="text-xs text-amber-300/80 mt-1">
                Under Section 15, payments to registered MSMEs must be settled within written agreement terms (max 45 days) or 15 days without agreement. Delayed payments mandate compound interest at 3x RBI bank rate under Section 16.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Structured Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Invoice Number */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Invoice Number</span>
            <div className="mt-2 text-lg font-mono font-bold text-slate-100">
              {invoice.invoiceNumber || <span className="text-slate-500 italic">Not Detected</span>}
            </div>
          </div>
          <div className="mt-4">
            <ReviewControls
              item={createReviewItem("invoiceNumber", invoice.invoiceNumber)}
              onAccept={() => onVerify("invoiceNumber")}
              onReject={() => onReject("invoiceNumber")}
              onEdit={(val) => onEdit("invoiceNumber", val)}
            />
          </div>
        </div>

        {/* Vendor Name */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Vendor / Supplier</span>
            <div className="mt-2 text-base font-semibold text-slate-100 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-blue-400 shrink-0" />
              {invoice.vendorName || <span className="text-slate-500 italic">Not Detected</span>}
            </div>
          </div>
          <div className="mt-4">
            <ReviewControls
              item={createReviewItem("vendorName", invoice.vendorName)}
              onAccept={() => onVerify("vendorName")}
              onReject={() => onReject("vendorName")}
              onEdit={(val) => onEdit("vendorName", val)}
            />
          </div>
        </div>

        {/* Total Amount */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Total Invoice Amount</span>
            <div className="mt-2 text-xl font-bold text-amber-400 flex items-center gap-1">
              ₹ {invoice.totalAmount !== undefined ? invoice.totalAmount.toLocaleString("en-IN") : "0"}
            </div>
          </div>
          <div className="mt-4">
            <ReviewControls
              item={createReviewItem("totalAmount", invoice.totalAmount)}
              onAccept={() => onVerify("totalAmount")}
              onReject={() => onReject("totalAmount")}
              onEdit={(val) => onEdit("totalAmount", parseFloat(val) || 0)}
            />
          </div>
        </div>

        {/* Invoice Date */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Invoice Date</span>
            <div className="mt-2 text-sm font-semibold text-slate-200 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-400" />
              {invoice.invoiceDate || <span className="text-slate-500 italic">Not Specified</span>}
            </div>
          </div>
          <div className="mt-4">
            <ReviewControls
              item={createReviewItem("invoiceDate", invoice.invoiceDate)}
              onAccept={() => onVerify("invoiceDate")}
              onReject={() => onReject("invoiceDate")}
              onEdit={(val) => onEdit("invoiceDate", val)}
            />
          </div>
        </div>

        {/* Payment Due Date */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Due Date (Sec 15 Max 45d)</span>
            <div className="mt-2 text-sm font-semibold text-slate-200 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-rose-400" />
              {invoice.dueDate || <span className="text-slate-500 italic">Not Specified</span>}
            </div>
            {daysOverdue > 0 && (
              <p className="text-xs text-rose-400 font-semibold mt-1">Overdue by {daysOverdue} days</p>
            )}
          </div>
          <div className="mt-4">
            <ReviewControls
              item={createReviewItem("dueDate", invoice.dueDate)}
              onAccept={() => onVerify("dueDate")}
              onReject={() => onReject("dueDate")}
              onEdit={(val) => onEdit("dueDate", val)}
            />
          </div>
        </div>

        {/* GSTIN / Tax ID */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">GSTIN / Tax ID</span>
            <div className="mt-2 text-sm font-mono font-bold text-slate-200">
              {invoice.gstin || <span className="text-slate-500 italic">Not Provided</span>}
            </div>
          </div>
          <div className="mt-4">
            <ReviewControls
              item={createReviewItem("gstin", invoice.gstin)}
              onAccept={() => onVerify("gstin")}
              onReject={() => onReject("gstin")}
              onEdit={(val) => onEdit("gstin", val)}
            />
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      {invoice.lineItems && invoice.lineItems.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <h4 className="text-md font-bold text-slate-200 mb-4">Extracted Line Items</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/60 text-xs uppercase text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Description</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Qty</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Unit Price (₹)</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {invoice.lineItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-slate-200">{item.description}</td>
                    <td className="py-3 px-4 text-right font-mono">{item.quantity}</td>
                    <td className="py-3 px-4 text-right font-mono">{item.unitPrice.toLocaleString("en-IN")}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                      {item.amount.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
