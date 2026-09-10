export interface SampleDocument {
  id: string;
  name: string;
  filename: string;
  type: "contract" | "invoice" | "general";
  riskScore: number;
  description: string;
  content: string;
}

export const SAMPLE_DOCUMENTS: SampleDocument[] = [
  {
    id: "contract-1",
    name: "Vendor Supply Agreement",
    filename: "Vendor_Supply_Agreement_2024.txt",
    type: "contract",
    riskScore: 85,
    description: "MSMED violations: 90-day payment, no late interest, one-sided indemnity",
    content: `VENDOR SUPPLY AGREEMENT

This Vendor Supply Agreement ("Agreement") is entered into on 15th March 2024 between:

ABC Manufacturing Pvt. Ltd., having its registered office at Plot No. 42, Industrial Estate, Pune - 411001 ("Buyer")
AND
M/s Sharma Components, having its office at 12, MIDC Area, Nashik - 422001 ("Vendor")

WHEREAS the Buyer wishes to procure components from the Vendor on the terms set out below.

1. PAYMENT TERMS
The Buyer shall make payment within ninety (90) calendar days of receipt of each invoice from the Vendor. The Buyer reserves the right to withhold payment in case of any dispute regarding quality. No interest shall accrue on delayed payments.

2. TERMINATION
Either party may terminate this Agreement by providing sixty (60) days written notice to the other party. The Agreement shall automatically renew on 15th March 2025 unless notice of termination is given 60 days before the renewal date.

3. LIABILITY AND INDEMNITY
The Vendor shall indemnify the Buyer and hold it harmless from any and all claims, damages, losses and expenses arising from the Vendor's supply of goods regardless of fault or negligence of the Buyer. The Buyer's liability under this Agreement shall be limited to the invoice value of the goods.

4. DISPUTE RESOLUTION
Any dispute arising under this Agreement shall be referred to a sole arbitrator to be appointed solely by the Managing Director of the Buyer Company. The arbitration shall be conducted in accordance with the Arbitration and Conciliation Act, 1996.

5. GOVERNING LAW
This Agreement shall be governed by the laws of India. The courts at Pune shall have exclusive jurisdiction.`,
  },
  {
    id: "contract-2",
    name: "IT Master Services Agreement",
    filename: "IT_Services_Agreement_2024.txt",
    type: "contract",
    riskScore: 92,
    description: "Section 27 non-compete, unilateral arbitrator, Section 74 forfeiture",
    content: `IT MASTER SERVICES AGREEMENT

This Agreement is entered into between TechCorp Solutions Pvt. Ltd. ("Company") and Dev Innovations LLP ("Service Provider") on 1st January 2024.

WHEREAS the Company desires to engage the Service Provider for software development services.

1. SERVICES AND PAYMENT
The Company shall pay the Service Provider within one hundred twenty (120) days of invoice date. All invoices must be submitted in the prescribed format.

2. CONFIDENTIALITY
The Service Provider agrees to maintain strict confidentiality of all proprietary information and trade secrets of the Company.

3. NON-COMPETITION
The Service Provider shall not engage in any competing business or provide similar services to any competitor of the Company for a period of two (2) years post-termination of this Agreement. This restriction applies to all industries in which the Company operates.

4. SECURITY DEPOSIT AND FORFEITURE
The Service Provider shall deposit Rs. 5,00,000 (Rupees Five Lakhs) as security. In the event of any breach, the Company shall forfeit 100% of the deposit without proof of actual damage. This amount shall be treated as liquidated damages agreed in advance.

5. DISPUTE RESOLUTION
Any dispute shall be referred to arbitration before a sole arbitrator appointed solely by the Managing Director of the Company. The seat of arbitration shall be London, United Kingdom.

6. TERMINATION
This Agreement expires on 31st December 2024. Either party may terminate with 30 days notice.`,
  },
  {
    id: "contract-3",
    name: "SaaS Subcontract Agreement",
    filename: "SaaS_Subcontract_Compliant.txt",
    type: "contract",
    riskScore: 15,
    description: "Compliant contract - Low Risk (negative test case)",
    content: `SAAS SUBCONTRACT AGREEMENT

This Subcontract Agreement is entered into between CloudBase Technologies ("Prime Contractor") and ByteWorks Solutions Pvt. Ltd. ("Subcontractor") effective 1st April 2024.

1. PAYMENT TERMS
Payment shall be made within thirty (30) days of receipt of a valid invoice. In the event of delayed payment beyond 45 days, interest shall accrue at three times the bank rate notified by the Reserve Bank of India, compounded monthly, as per Section 16, MSMED Act, 2006.

2. INTELLECTUAL PROPERTY
All work product developed under this Agreement shall vest in the Prime Contractor upon full payment.

3. DISPUTE RESOLUTION
Any dispute shall be referred to arbitration. The sole arbitrator shall be mutually appointed by both parties in writing within 30 days of the dispute. Failing agreement, either party may approach a competent court under Section 11 of the Arbitration and Conciliation Act, 1996. The seat of arbitration shall be Bangalore, India.

4. LIMITATION OF LIABILITY
Each party shall indemnify the other only for losses directly caused by that party's own negligence or material breach. Aggregate liability of either party shall not exceed fees paid in the preceding 12 months.

5. TERMINATION
Either party may terminate with 60 days written notice. No automatic renewal applies.`,
  },
  {
    id: "invoice-1",
    name: "Compliant Invoice - 30-day Terms",
    filename: "Tax_Invoice_INV_0892.txt",
    type: "invoice",
    riskScore: 10,
    description: "MSMED compliant: 30-day terms, complete GST details",
    content: `TAX INVOICE

Vendor: M/s Sharma Components
Address: 12, MIDC Area, Nashik - 422001
GSTIN: 27AAACS1234A1Z5

Invoice No.: INV-2024-0892
Invoice Date: 01/09/2024
Due Date: 01/10/2024
Payment Terms: Net 30 days

Bill To:
ABC Manufacturing Pvt. Ltd.
Plot No. 42, Industrial Estate, Pune - 411001
GSTIN: 27AAACR5055K1ZR

Particulars                    Qty    Rate      Amount
Steel Brackets (Grade A)       500    Rs. 120   Rs. 60,000
Mounting Clips                 1000   Rs. 45    Rs. 45,000
Fastener Sets                  200    Rs. 85    Rs. 17,000

Sub-total:                                      Rs. 1,22,000
CGST @ 9%:                                      Rs. 10,980
SGST @ 9%:                                      Rs. 10,980
Total Payable:                                  Rs. 1,43,960

Bank Details: HDFC Bank, A/c 12345678901234, IFSC: HDFC0001234`,
  },
  {
    id: "invoice-2",
    name: "Non-Compliant Invoice - 60-day Terms",
    filename: "NonCompliant_Invoice_TP456.txt",
    type: "invoice",
    riskScore: 78,
    description: "MSMED violation: 60-day terms, incomplete GST",
    content: `INVOICE

From: Tech Parts Supplier
Delhi - 110001

Invoice Number: TP/2024/456
Date: 15/08/2024
Due Date: 15/10/2024

To: XYZ Enterprises Pvt. Ltd.

Description              Amount
Electronic Components    Rs. 85,000
Assembly Services        Rs. 25,000
Packaging                Rs. 5,000

Sub-total: Rs. 1,15,000
GST: Rs. 20,700
Grand Total: Rs. 1,35,700

Payment Terms: 60 days from invoice date`,
  },
  {
    id: "general-1",
    name: "Purchase Order",
    filename: "Purchase_Order_PO1087.txt",
    type: "general",
    riskScore: 25,
    description: "Sample PO - tests General Document mode",
    content: `PURCHASE ORDER

PO Number: PO-2024-1087
Date: 05/09/2024

From: ABC Manufacturing Pvt. Ltd.
To: M/s Sharma Components

Please supply the following items as per our specification:

Item                    Qty    Unit Price    Total
Steel Brackets Grade A  500    Rs. 120       Rs. 60,000
Mounting Clips          1000   Rs. 45        Rs. 45,000

Total Order Value: Rs. 1,05,000 + GST as applicable
Delivery Date: 20/09/2024
Delivery Address: Plot No. 42, Industrial Estate, Pune - 411001

Payment: As per existing Vendor Supply Agreement terms.
This PO is valid for 30 days from date of issue.

Authorised Signatory: Rajesh Kumar, Purchase Manager`,
  },
];
