import { jsPDF } from "jspdf";
import type { Property, Lead } from "../types";

// ─── Colour Palette ────────────────────────────────────────────────────────
const C = {
    black:       [10,  10,  10]  as [number, number, number],
    darkGray:    [28,  28,  30]  as [number, number, number],
    midGray:     [60,  60,  65]  as [number, number, number],
    lightGray:   [120, 120, 128] as [number, number, number],
    offWhite:    [245, 244, 240] as [number, number, number],
    white:       [255, 255, 255] as [number, number, number],
    amber:       [217, 119,   6] as [number, number, number],
    amberLight:  [251, 191,  36] as [number, number, number],
    gold:        [180, 140,  50] as [number, number, number],
    green:       [ 22, 163,  74] as [number, number, number],
    blue:        [ 37, 99,  235] as [number, number, number],
    purple:      [124,  58, 237] as [number, number, number],
    red:         [220,  38,  38] as [number, number, number],
};

// ─── Helpers ───────────────────────────────────────────────────────────────
const fmt = (n: number) =>
    new Intl.NumberFormat("en-AE", {
        style: "currency",
        currency: "AED",
        maximumFractionDigits: 0,
    }).format(n);

const setFill  = (doc: jsPDF, rgb: [number,number,number]) => doc.setFillColor(...rgb);
const setStroke= (doc: jsPDF, rgb: [number,number,number]) => doc.setDrawColor(...rgb);
const setColor = (doc: jsPDF, rgb: [number,number,number]) => doc.setTextColor(...rgb);

/** Draw a rounded rect that jsPDF supports (4.x API: roundedRect) */
const roundedRect = (
    doc: jsPDF,
    x: number, y: number, w: number, h: number,
    r: number,
    style: "F" | "S" | "FD" = "F"
) => {
    (doc as any).roundedRect(x, y, w, h, r, r, style);
};

/** Load an external image and return a JPEG data-URL string. Returns null on CORS failure. */
const loadImageAsDataUrl = (url: string): Promise<string | null> =>
    new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                canvas.width  = img.naturalWidth  || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext("2d");
                if (!ctx) { resolve(null); return; }
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL("image/jpeg", 0.82));
            } catch { resolve(null); }
        };
        img.onerror = () => resolve(null);
        img.src = url;
        setTimeout(() => resolve(null), 5000);
    });

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────
export const generatePropertyBrochure = async (
    property: Property,
    agentName: string
) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const PW = doc.internal.pageSize.getWidth();   // 595.28
    const PH = doc.internal.pageSize.getHeight();  // 841.89
    const PAD = 36; // page margin

    // ── 1. FULL-BLEED DARK HEADER BAR ─────────────────────────────────────
    setFill(doc, C.darkGray);
    doc.rect(0, 0, PW, 68, "F");

    // Amber accent line
    setFill(doc, C.amber);
    doc.rect(0, 68, PW, 3, "F");

    // Brand name (left)
    setColor(doc, C.white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("D CAPITAL", PAD, 32);

    setColor(doc, C.amber);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("REAL ESTATE  ·  DUBAI", PAD, 46);

    // Document title (right)
    setColor(doc, C.amberLight);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("PROPERTY BROCHURE", PW - PAD, 30, { align: "right" });

    setColor(doc, C.lightGray);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(new Date().toLocaleDateString("en-AE", { day: "2-digit", month: "long", year: "numeric" }), PW - PAD, 44, { align: "right" });

    // ── 2. HERO IMAGE ─────────────────────────────────────────────────────
    const heroTop    = 71;
    const heroH      = 220;
    const imageData  = property.imageUrl ? await loadImageAsDataUrl(property.imageUrl) : null;

    if (imageData) {
        doc.addImage(imageData, "JPEG", 0, heroTop, PW, heroH);
    } else {
        // Fallback gradient-style placeholder
        setFill(doc, C.midGray);
        doc.rect(0, heroTop, PW, heroH, "F");
        setColor(doc, C.lightGray);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text("[ Property Image ]", PW / 2, heroTop + heroH / 2, { align: "center" });
    }

    // Gradient overlay on hero (bottom-to-top dark fade)
    for (let i = 0; i < 80; i++) {
        const alpha = Math.round((i / 80) * 160);
        doc.setFillColor(10, 10, 10);
        doc.setGState(new (doc as any).GState({ opacity: alpha / 255 }));
        doc.rect(0, heroTop + heroH - i, PW, 1, "F");
    }
    doc.setGState(new (doc as any).GState({ opacity: 1 }));

    // Inventory type badge over hero
    const invType = property.inventoryType || "Direct";
    const badgeColor = invType === "Indirect" ? C.blue : C.amber;
    setFill(doc, badgeColor);
    roundedRect(doc, PAD, heroTop + 12, 70, 18, 5);
    setColor(doc, invType === "Indirect" ? C.white : C.black);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(invType.toUpperCase() + " LISTING", PAD + 35, heroTop + 24.5, { align: "center" });

    // Status badge
    const statusColor = property.status === "Available" ? C.green : property.status === "Sold" ? C.red : C.amber;
    setFill(doc, statusColor);
    roundedRect(doc, PAD + 76, heroTop + 12, 62, 18, 5);
    setColor(doc, property.status === "Sold" ? C.white : C.black);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(property.status.toUpperCase(), PAD + 107, heroTop + 24.5, { align: "center" });

    // Project status badge (off-plan / ready)
    if (property.projectStatus) {
        const psColor = property.projectStatus === "Off-Plan" ? C.purple : C.green;
        setFill(doc, psColor);
        roundedRect(doc, PAD + 144, heroTop + 12, 60, 18, 5);
        setColor(doc, C.white);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.text(property.projectStatus.toUpperCase(), PAD + 174, heroTop + 24.5, { align: "center" });
    }

    // ── 3. PROPERTY TITLE BLOCK ───────────────────────────────────────────
    let curY = heroTop + heroH + 22;

    // Property name
    setColor(doc, C.darkGray);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    const titleLines = doc.splitTextToSize(property.name, PW - PAD * 2 - 160);
    doc.text(titleLines, PAD, curY);

    // Price (right-aligned, large)
    setColor(doc, C.amber);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(fmt(property.price), PW - PAD, curY, { align: "right" });

    curY += titleLines.length * 24 + 4;

    // Developer + Location row
    setColor(doc, C.midGray);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(`${property.developer}  ·  ${property.location}`, PAD, curY);

    if (property.commissionRate) {
        setColor(doc, C.lightGray);
        doc.text(`Commission: ${property.commissionRate}%`, PW - PAD, curY, { align: "right" });
    }

    curY += 18;

    // Divider
    setStroke(doc, C.offWhite);
    setFill(doc, C.offWhite);
    doc.rect(PAD, curY, PW - PAD * 2, 1, "F");
    curY += 14;

    // ── 4. CORE SPECS GRID (4 columns) ────────────────────────────────────
    const specs: Array<{ label: string; value: string }> = [
        { label: "TYPE",      value: property.type },
        { label: "BEDROOMS",  value: String(property.bedrooms) },
        { label: "BATHROOMS", value: String(property.bathrooms) },
        { label: "AREA (sqft)", value: (property.sqft || 0).toLocaleString() },
    ];
    if (property.bua)      specs.push({ label: "BUA (sqft)",     value: property.bua.toLocaleString() });
    if (property.plotSize) specs.push({ label: "PLOT SIZE (sqft)", value: property.plotSize.toLocaleString() });

    const colCount  = 4;
    const colW      = (PW - PAD * 2) / colCount;
    const cellH     = 52;

    specs.slice(0, colCount * 2).forEach((spec, i) => {
        const col = i % colCount;
        const row = Math.floor(i / colCount);
        const cx  = PAD + col * colW;
        const cy  = curY + row * (cellH + 6);

        // Cell background
        setFill(doc, C.offWhite);
        roundedRect(doc, cx + 2, cy, colW - 6, cellH, 6);

        // Label
        setColor(doc, C.lightGray);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.text(spec.label, cx + 10, cy + 14);

        // Value
        setColor(doc, C.darkGray);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text(spec.value, cx + 10, cy + 36);
    });

    const gridRows = Math.ceil(Math.min(specs.length, colCount * 2) / colCount);
    curY += gridRows * (cellH + 6) + 14;

    // ── 5. ADVANCED DETAILS ROW ───────────────────────────────────────────
    const advancedItems: Array<{ label: string; value: string }> = [];
    if (property.view)          advancedItems.push({ label: "VIEW",          value: property.view });
    if (property.furnishing)    advancedItems.push({ label: "FURNISHING",    value: property.furnishing });
    if (property.paymentPlan)   advancedItems.push({ label: "PAYMENT PLAN",  value: property.paymentPlan });
    if (property.handoverDate)  advancedItems.push({ label: "HANDOVER",      value: property.handoverDate });
    if (property.reraPermit)    advancedItems.push({ label: "RERA PERMIT",   value: property.reraPermit });

    if (advancedItems.length > 0) {
        // Section heading
        setFill(doc, C.darkGray);
        doc.rect(PAD, curY, 3, 14, "F");
        setColor(doc, C.darkGray);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.text("ADVANCED DETAILS", PAD + 8, curY + 11);
        curY += 22;

        const advW   = (PW - PAD * 2) / advancedItems.length;
        advancedItems.forEach((item, i) => {
            const cx = PAD + i * advW;

            // subtle separator line between items
            if (i > 0) {
                setStroke(doc, C.offWhite);
                doc.line(cx, curY - 2, cx, curY + 32);
            }

            setColor(doc, C.lightGray);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(6.5);
            doc.text(item.label, cx + (i > 0 ? 10 : 0), curY + 8);

            setColor(doc, C.darkGray);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9.5);
            const lines = doc.splitTextToSize(item.value, advW - 14);
            doc.text(lines, cx + (i > 0 ? 10 : 0), curY + 22);
        });
        curY += 44;

        // Divider
        setFill(doc, C.offWhite);
        doc.rect(PAD, curY, PW - PAD * 2, 1, "F");
        curY += 14;
    }

    // ── 6. DESCRIPTION BLOCK ─────────────────────────────────────────────
    if (property.description) {
        setFill(doc, C.darkGray);
        doc.rect(PAD, curY, 3, 14, "F");
        setColor(doc, C.darkGray);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.text("PROPERTY OVERVIEW", PAD + 8, curY + 11);
        curY += 22;

        setColor(doc, C.midGray);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        const descLines = doc.splitTextToSize(property.description, PW - PAD * 2);
        doc.text(descLines, PAD, curY);
        curY += descLines.length * 12 + 14;

        setFill(doc, C.offWhite);
        doc.rect(PAD, curY, PW - PAD * 2, 1, "F");
        curY += 14;
    }

    // ── 7. RERA / COMPLIANCE CALLOUT (if permit exists) ──────────────────
    if (property.reraPermit) {
        setFill(doc, [236, 253, 245] as any);
        setStroke(doc, [134, 239, 172] as any);
        roundedRect(doc, PAD, curY, PW - PAD * 2, 34, 6, "FD");

        setColor(doc, C.green);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.text("✔  RERA COMPLIANT LISTING", PAD + 10, curY + 13);

        setColor(doc, C.midGray);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.text(`Permit No: ${property.reraPermit}`, PAD + 10, curY + 26);

        doc.setFont("helvetica", "italic");
        doc.text("Registered with the Real Estate Regulatory Agency – Dubai Land Department", PW - PAD, curY + 26, { align: "right" });
        curY += 48;
    }

    // ── 8. PREMIUM FOOTER ─────────────────────────────────────────────────
    const footerH = 90;
    const footerY = PH - footerH;

    // Dark footer background
    setFill(doc, C.darkGray);
    doc.rect(0, footerY, PW, footerH, "F");

    // Amber top accent
    setFill(doc, C.amber);
    doc.rect(0, footerY, PW, 2.5, "F");

    // Left: branding
    setColor(doc, C.white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("D CAPITAL REAL ESTATE", PAD, footerY + 24);

    setColor(doc, C.amber);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("RERA REGISTERED BROKERAGE  ·  DUBAI, UAE", PAD, footerY + 36);

    setColor(doc, C.lightGray);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("admin@dcapitalrealestate.com  ·  www.dcapitalrealestate.com", PAD, footerY + 49);
    doc.text("+971 4 XXX XXXX", PAD, footerY + 61);

    // Right: agent card
    setFill(doc, [40, 40, 44] as any);
    roundedRect(doc, PW - PAD - 170, footerY + 10, 170, 68, 6);

    setColor(doc, C.amberLight);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("YOUR DEDICATED AGENT", PW - PAD - 85, footerY + 24, { align: "center" });

    setColor(doc, C.white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(agentName, PW - PAD - 85, footerY + 42, { align: "center" });

    setColor(doc, C.lightGray);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("Licensed Real Estate Agent", PW - PAD - 85, footerY + 56, { align: "center" });
    doc.text("D Capital Real Estate L.L.C.", PW - PAD - 85, footerY + 67, { align: "center" });

    // ── 9. PAGE NUMBER ────────────────────────────────────────────────────
    setColor(doc, C.lightGray);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("Page 1 of 1  ·  Confidential — For Recipient Use Only", PW / 2, PH - 8, { align: "center" });

    // ── 10. SAVE ──────────────────────────────────────────────────────────
    const safeName = property.name.replace(/[^a-z0-9]/gi, "_").substring(0, 40);
    doc.save(`D_Capital_Brochure_${safeName}.pdf`);
};


// ─── Lead Brief (unchanged, just re-exported) ─────────────────────────────
export const generateLeadBrief = async (lead: Lead, assignedAgentName: string) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();

    // HEADER
    doc.setFillColor(28, 28, 30);
    doc.rect(0, 0, PW, 100, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("CLIENT BRIEF", 40, 50);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 40, 75);

    // CLIENT DETAILS
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(lead.name, 40, 150);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    let y = 180;

    const details = [
        `Contact: ${lead.phone} | ${lead.email}`,
        `Pipeline Status: ${lead.status}`,
        `Source: ${lead.source}`,
        `Assigned Agent: ${assignedAgentName}`,
        `Budget: ${lead.budget ? fmt(lead.budget) : "Pending Qualification"}`,
        `Target Location: ${lead.targetLocation || "Any"}`,
    ];

    details.forEach(detail => {
        doc.text(detail, 40, y);
        y += 25;
    });

    // KYC STATUS
    y += 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("KYC & Compliance Status", 40, y);
    doc.line(40, y + 5, 250, y + 5);

    y += 25;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    const kyc = lead.kyc || { passport: false, emiratesId: false, formB: false };
    doc.text(`Passport Copy: ${kyc.passport ? "Verified" : "Missing"}`, 40, y); y += 20;
    doc.text(`Emirates ID: ${kyc.emiratesId ? "Verified" : "Missing"}`, 40, y); y += 20;
    doc.text(`Signed Form B: ${kyc.formB ? "Verified" : "Missing"}`, 40, y); y += 40;

    // NOTES
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Internal Notes", 40, y);
    doc.line(40, y + 5, 250, y + 5);

    y += 25;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    const notesData = lead.notes;
    let notesText = "No notes currently stored for this client.";
    if (notesData) {
        if (Array.isArray(notesData) && notesData.length > 0) {
            notesText = notesData.map((n: any) => typeof n === "object" && n.text ? n.text : String(n)).join("\n");
        } else if (typeof notesData === "string" && notesData.trim() !== "") {
            notesText = notesData;
        }
    }
    const noteLines = doc.splitTextToSize(notesText, PW - 80);
    doc.text(noteLines, 40, y);

    // FOOTER
    doc.setFillColor(245, 245, 245);
    doc.rect(0, PH - 80, PW, 80, "F");

    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("D Capital Real Estate L.L.C. — Internal Client Brief", 40, PH - 45);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text("Strictly Confidential. Do not distribute externally.", 40, PH - 30);

    doc.save(`Client_Brief_${lead.name.replace(/[^a-z0-9]/gi, "_")}.pdf`);
};
