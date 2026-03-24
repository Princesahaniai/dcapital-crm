import { jsPDF } from "jspdf";
import type { Property, Lead } from "../types";

// Helper to format currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(amount);
};

export const generatePropertyBrochure = async (property: Property, agentName: string) => {
    // We will generate the PDF without relying fully on DOM elements by drawing directly
    // Or we could create a hidden div, but drawing with jspdf is cleaner for fixed templates.
    // For this requirement, we will draw a professional A4 document.

    const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4"
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // BACKGROUND / HEADER
    doc.setFillColor(28, 28, 30); // Dark header
    doc.rect(0, 0, pageWidth, 120, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.text("PROPERTY BROCHURE", 40, 60);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text("Exclusive Luxury Collection", 40, 85);

    // PROPERTY DETAILS
    doc.setTextColor(40, 40, 40);

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    // Auto wrap text
    const titleLines = doc.splitTextToSize(property.name, pageWidth - 80);
    doc.text(titleLines, 40, 170);

    const titleHeight = titleLines.length * 25;
    let startY = 170 + titleHeight;

    // Price & Location
    doc.setFontSize(18);
    doc.setTextColor(217, 119, 6); // Amber color
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(property.price), 40, startY);

    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text(`Location: ${property.location || 'Dubai, UAE'}`, 40, startY + 25);

    // Type & Specs
    doc.setFontSize(12);
    doc.text(`Type: ${property.type} | Developer: ${property.developer}`, 40, startY + 50);
    doc.text(`Bedrooms: ${property.bedrooms} | Bathrooms: ${property.bathrooms} | SqFt: ${property.sqft}`, 40, startY + 70);

    // Description
    startY += 120;
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "bold");
    doc.text("Description", 40, startY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    const descLines = doc.splitTextToSize(property.description || 'No description available.', pageWidth - 80);
    doc.text(descLines, 40, startY + 25);

    // Try to load and add the main image if it exists
    if (property.imageUrl) {
        try {
            // Wait for image to load to get dimensions and convert to base64 if needed
            // For simplicity in a browser env with external images, this can be tricky due to CORS.
            // We'll wrap in try/catch to avoid freezing if CORS blocks it.
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = property.imageUrl;

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                setTimeout(resolve, 3000); // 3 sec timeout
            });

            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

                // Draw image on PDF (width: pageWidth - 80, height: proportional)
                const imgWidth = pageWidth - 80;
                const imgHeight = (img.height * imgWidth) / img.width;

                let imgY = startY + 30 + (descLines.length * 15) + 20;

                // If image goes off page, add new page
                if (imgY + imgHeight > pageHeight - 100) {
                    doc.addPage();
                    imgY = 40;
                }

                doc.addImage(dataUrl, 'JPEG', 40, imgY, imgWidth, imgHeight);
            }
        } catch (e) {
            console.warn("Could not load property image for PDF due to CORS or timeout.", e);
        }
    }

    // FOOTER (BRANDING & CONTACT)
    doc.setFillColor(245, 245, 245);
    doc.rect(0, pageHeight - 100, pageWidth, 100, 'F');

    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Doom Capital Real Estate L.L.C.", 40, pageHeight - 65);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("The pinnacle of luxury real estate advisory in Dubai.", 40, pageHeight - 45);

    // Agent
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text(`Prepared by: ${agentName}`, pageWidth - 40, pageHeight - 65, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text("admin@dcapitalrealestate.com", pageWidth - 40, pageHeight - 45, { align: "right" });

    // Save PDF
    doc.save(`Brochure_${property.name.replace(/[^a-z0-9]/gi, '_')}.pdf`);
};

export const generateLeadBrief = async (lead: Lead, assignedAgentName: string) => {
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4"
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // HEADER
    doc.setFillColor(28, 28, 30);
    doc.rect(0, 0, pageWidth, 100, 'F');

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
        `Budget: ${lead.budget ? formatCurrency(lead.budget) : 'Pending Qualification'}`,
        `Target Location: ${lead.targetLocation || 'Any'}`,
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
    doc.text(`Passport Copy: ${kyc.passport ? 'Verified' : 'Missing'}`, 40, y); y += 20;
    doc.text(`Emirates ID: ${kyc.emiratesId ? 'Verified' : 'Missing'}`, 40, y); y += 20;
    doc.text(`Signed Form B: ${kyc.formB ? 'Verified' : 'Missing'}`, 40, y); y += 40;

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
    let notesText = 'No notes currently stored for this client.';
    if (notesData) {
        if (Array.isArray(notesData) && notesData.length > 0) {
            notesText = notesData.map((n: any) => typeof n === 'object' && n.text ? n.text : String(n)).join('\n');
        } else if (typeof notesData === 'string' && notesData.trim() !== '') {
            notesText = notesData;
        }
    }
    const noteLines = doc.splitTextToSize(notesText, pageWidth - 80);
    doc.text(noteLines, 40, y);

    // FOOTER (BRANDING & CONTACT)
    doc.setFillColor(245, 245, 245);
    doc.rect(0, pageHeight - 80, pageWidth, 80, 'F');

    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Doom Capital Real Estate L.L.C. - Internal Client Brief", 40, pageHeight - 45);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text("Strictly Confidential. Do not distribute externally.", 40, pageHeight - 30);

    // Save PDF
    doc.save(`Client_Brief_${lead.name.replace(/[^a-z0-9]/gi, '_')}.pdf`);
};
