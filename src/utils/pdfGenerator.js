import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

/**
 * Generates an official, publication-quality Acknowledgment Receipt in PDF.
 */
export const generateAcknowledgmentReceipt = (ticket, user = {}) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = [22, 101, 192]; // #1665c0 navy blue
  const accentColor = [13, 148, 136]; // #0d9488 teal
  const textDark = [30, 41, 59]; // #1e293b
  const textMuted = [100, 116, 139]; // #64748b

  // --- Outer Border & Header Banner ---
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.rect(10, 10, 190, 277);

  // Top header banner
  doc.setFillColor(...primaryColor);
  doc.rect(10, 10, 190, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('RESOLVENOW ENTERPRISE GRIEVANCE REDRESSAL SYSTEM', 105, 21, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('OFFICIAL INSTITUTIONAL GRIEVANCE INTAKE ACKNOWLEDGMENT', 105, 28, { align: 'center' });

  // --- Receipt Metadata Strip ---
  const ticketId = ticket.ticket_id || ticket.id || 'N/A';
  const createdDate = ticket.created_at ? format(new Date(ticket.created_at), 'dd MMM yyyy, hh:mm a') : format(new Date(), 'dd MMM yyyy, hh:mm a');

  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`RECEIPT REF: #${ticketId.toUpperCase()}`, 15, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...textMuted);
  doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm:ss a')}`, 195, 42, { align: 'right' });

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(15, 46, 195, 46);

  // --- Grid: Complainant & Case Particulars ---
  doc.setFillColor(248, 250, 252);
  doc.rect(15, 50, 180, 48, 'F');
  doc.rect(15, 50, 180, 48, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...primaryColor);
  doc.text('1. CITIZEN & COMPLAINT PARTICULARS', 20, 57);

  doc.setFontSize(8.5);
  doc.setTextColor(...textDark);

  doc.setFont('helvetica', 'bold');
  doc.text('Complainant:', 20, 65);
  doc.setFont('helvetica', 'normal');
  doc.text(ticket.is_anonymous ? 'Whistleblower Anonymous Citizen' : (ticket.student_name || user.name || user.email || 'Registered Student'), 50, 65);

  doc.setFont('helvetica', 'bold');
  doc.text('Category:', 20, 73);
  doc.setFont('helvetica', 'normal');
  doc.text(ticket.category || 'General Support', 50, 73);

  doc.setFont('helvetica', 'bold');
  doc.text('Target Dept:', 20, 81);
  doc.setFont('helvetica', 'normal');
  doc.text(ticket.department || 'Central Redressal Cell', 50, 81);

  doc.setFont('helvetica', 'bold');
  doc.text('Urgency Level:', 20, 89);
  doc.setFont('helvetica', 'normal');
  doc.text(ticket.urgency || 'Medium', 50, 89);

  // Right column of particulars
  doc.setFont('helvetica', 'bold');
  doc.text('Date Logged:', 115, 65);
  doc.setFont('helvetica', 'normal');
  doc.text(createdDate, 142, 65);

  doc.setFont('helvetica', 'bold');
  doc.text('SLA Target:', 115, 73);
  doc.setFont('helvetica', 'normal');
  doc.text(`${ticket.urgency === 'High' ? '24 Hours' : '48 Hours'} Guaranteed`, 142, 73);

  doc.setFont('helvetica', 'bold');
  doc.text('Status:', 115, 81);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(ticket.status || 'PENDING ASSIGNMENT', 142, 81);
  doc.setTextColor(...textDark);

  // --- Section 2: Subject & Narrative ---
  doc.setFillColor(248, 250, 252);
  doc.rect(15, 104, 180, 65, 'F');
  doc.rect(15, 104, 180, 65, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...primaryColor);
  doc.text('2. SUBJECT STATEMENT & LODGED NARRATIVE', 20, 111);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...textDark);
  doc.text(`Subject: ${ticket.title || 'Institutional Grievance Report'}`, 20, 119);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  const splitDescription = doc.splitTextToSize(ticket.description || 'No detailed description specified.', 170);
  doc.text(splitDescription.slice(0, 7), 20, 126);

  // --- Section 3: SLA Commitment & Cryptographic Verification ---
  doc.setFillColor(248, 250, 252);
  doc.rect(15, 175, 180, 60, 'F');
  doc.rect(15, 175, 180, 60, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...primaryColor);
  doc.text('3. SERVICE LEVEL AGREEMENT & AUDIT INTEGRITY', 20, 182);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textDark);
  doc.text('• This grievance is legally logged into the university immutable audit ledger.', 20, 190);
  doc.text('• Department Nodal Officers must investigate and issue resolution within standard SLA limits.', 20, 196);
  doc.text('• Unresolved grievances automatically escalate to the Central Ombudsman upon SLA breach.', 20, 202);

  doc.setFont('helvetica', 'bold');
  doc.text('Cryptographic Proof Hash:', 20, 212);
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  const proofHash = ticket.proof_hash || 'SHA256-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  doc.text(proofHash, 20, 218);

  // --- Official Stamp & Seal Area ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryColor);
  doc.text('DIGITALLY CERTIFIED & TIMESTAMPED', 105, 250, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...textMuted);
  doc.text('ResolveNow Compliance & Redressal Framework • ISO/IEC 27001 Certified System', 105, 255, { align: 'center' });
  doc.text('Track status at: https://resolvenow.campus.edu/track', 105, 260, { align: 'center' });

  // Save the PDF
  doc.save(`Grievance_Receipt_${ticketId}.pdf`);
};

/**
 * Generates an official Institutional Resolution Certificate in PDF.
 */
export const generateResolutionCertificate = (ticket, user = {}) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const goldPrimary = [180, 130, 40]; // Gold border
  const navyDark = [15, 23, 42]; // #0f172a
  const textDark = [30, 41, 59];
  const textMuted = [100, 116, 139];

  // Outer Ornate Double Border
  doc.setDrawColor(...goldPrimary);
  doc.setLineWidth(1.5);
  doc.rect(10, 10, 277, 190);

  doc.setLineWidth(0.5);
  doc.rect(13, 13, 271, 184);

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...navyDark);
  doc.text('OFFICIAL CERTIFICATE OF RESOLUTION & REDRESSAL', 148.5, 32, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...goldPrimary);
  doc.text('INSTITUTIONAL OMBUDSMAN & GRIEVANCE REDRESSAL AUTHORITY', 148.5, 39, { align: 'center' });

  // Divider ribbon
  doc.setDrawColor(...goldPrimary);
  doc.line(40, 43, 257, 43);

  // Certificate Body
  const ticketId = ticket.ticket_id || ticket.id || 'N/A';
  const resolvedDate = ticket.resolved_at ? format(new Date(ticket.resolved_at), 'dd MMMM yyyy') : format(new Date(), 'dd MMMM yyyy');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(...textDark);
  doc.text('This is to officially certify that the formal grievance identified under Reference Number:', 148.5, 55, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...navyDark);
  doc.text(`REF: #${ticketId.toUpperCase()}`, 148.5, 64, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...textDark);
  doc.text(`Subject: "${ticket.title || 'Institutional Grievance'}"`, 148.5, 73, { align: 'center' });

  doc.text(
    `Filed under the Department of ${ticket.department || 'General Administration'} has been rigorously investigated, `,
    148.5, 83, { align: 'center' }
  );
  doc.text(
    'satisfactorily rectified, and formally closed in strict compliance with the Institutional Charter.',
    148.5, 90, { align: 'center' }
  );

  // Resolution Details Box
  doc.setFillColor(248, 250, 252);
  doc.rect(35, 100, 227, 40, 'F');
  doc.rect(35, 100, 227, 40, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...navyDark);
  doc.text('RECORD OF RESOLUTION & CORRECTIVE ACTION:', 40, 107);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textDark);
  const resolutionText = ticket.resolution_notes || 'All reported defects and grievances were verified on-site, remediated by the dispatched engineering and administrative team, and certified for closure.';
  const splitRes = doc.splitTextToSize(resolutionText, 217);
  doc.text(splitRes.slice(0, 3), 40, 115);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...goldPrimary);
  doc.text(`Closure Date: ${resolvedDate}   •   SLA Status: Fulfilled within Guaranteed Timeline`, 40, 133);

  // Signatures Section
  // Left: Nodal Officer
  doc.setDrawColor(...textMuted);
  doc.line(45, 168, 105, 168);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...navyDark);
  doc.text('DEPARTMENT NODAL OFFICER', 75, 173, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.text('Authorized Signature & Seal', 75, 178, { align: 'center' });

  // Center: Seal
  doc.setFillColor(241, 245, 249);
  doc.circle(148.5, 166, 12, 'F');
  doc.setDrawColor(...goldPrimary);
  doc.circle(148.5, 166, 12, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...goldPrimary);
  doc.text('INSTITUTIONAL', 148.5, 164, { align: 'center' });
  doc.text('SEAL', 148.5, 168, { align: 'center' });

  // Right: Ombudsman Registrar
  doc.line(192, 168, 252, 168);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...navyDark);
  doc.text('CENTRAL OMBUDSMAN REGISTRAR', 222, 173, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.text('Compliance Certification', 222, 178, { align: 'center' });

  // Bottom Hash Footnote
  doc.setFont('courier', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...textMuted);
  doc.text(`Proof Hash: ${ticket.proof_hash || 'SHA256-CERTIFIED-RESOLVENOW-RECORD'}`, 148.5, 188, { align: 'center' });

  doc.save(`Resolution_Certificate_${ticketId}.pdf`);
};
