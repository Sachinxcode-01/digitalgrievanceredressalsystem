import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';

export const reportService = {
  /**
   * Export grievances array as CSV string download
   */
  exportToCsv(tickets, filename = 'ResolveNow_Admin_Report.csv') {
    if (!tickets || tickets.length === 0) {
      toast.error('No grievance data available for CSV export.');
      return;
    }

    const headers = [
      'Ticket ID', 'Title', 'Category', 'Priority', 'Status', 
      'Department', 'Assigned To', 'User Email', 'Frustration Index', 
      'Created At', 'SLA Due At', 'Resolved At', 'Resolution Notes'
    ];

    const rows = tickets.map(t => [
      `"${t.ticket_id || ''}"`,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${t.category || ''}"`,
      `"${t.urgency || ''}"`,
      `"${t.status || ''}"`,
      `"${t.department || ''}"`,
      `"${t.assigned_to || 'Unassigned'}"`,
      `"${t.email || ''}"`,
      t.frustration_index || 1,
      `"${t.created_at ? new Date(t.created_at).toLocaleString() : ''}"`,
      `"${t.sla_due_at ? new Date(t.sla_due_at).toLocaleString() : ''}"`,
      `"${t.resolved_at ? new Date(t.resolved_at).toLocaleString() : ''}"`,
      `"${(t.resolution_notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${tickets.length} records to CSV.`);
  },

  /**
   * Export grievances array as Excel-compatible TSV/CSV format
   */
  exportToExcel(tickets, filename = 'ResolveNow_Admin_Summary.xls') {
    if (!tickets || tickets.length === 0) {
      toast.error('No grievance data available for Excel export.');
      return;
    }

    const headers = [
      'Ticket ID', 'Title', 'Category', 'Priority', 'Status', 
      'Department', 'Assigned Officer', 'Filing Email', 'Frustration Score', 
      'Filing Date', 'SLA Target Date', 'Resolution Date', 'Resolution Notes'
    ];

    const rows = tickets.map(t => [
      t.ticket_id || '',
      (t.title || '').replace(/\t/g, ' '),
      t.category || '',
      t.urgency || '',
      t.status || '',
      t.department || '',
      t.assigned_to || 'Unassigned',
      t.email || '',
      t.frustration_index || 1,
      t.created_at ? new Date(t.created_at).toLocaleString() : '',
      t.sla_due_at ? new Date(t.sla_due_at).toLocaleString() : '',
      t.resolved_at ? new Date(t.resolved_at).toLocaleString() : '',
      (t.resolution_notes || '').replace(/\t/g, ' ')
    ]);

    const excelContent = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    const blob = new Blob(['\uFEFF' + excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${tickets.length} records to Excel format.`);
  },

  /**
   * Export Administrative PDF Executive Dossier Summary via jsPDF
   */
  exportToPdfSummary(tickets, filters = {}, filename = 'ResolveNow_Executive_Summary.pdf') {
    if (!tickets || tickets.length === 0) {
      toast.error('No grievance data available for PDF report.');
      return;
    }

    try {
      const doc = new jsPDF();
      const nowString = new Date().toLocaleString();

      // Header Branding Banner
      doc.setFillColor(37, 99, 235); // Blue Primary
      doc.rect(0, 0, 210, 48, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("RESOLVENOW ADMIN EXECUTIVE REPORT", 15, 24);
      doc.setFontSize(10);
      doc.text(`CONFIDENTIAL OPERATIONAL SUMMARY`, 15, 32);
      doc.text(`GENERATED: ${nowString}`, 135, 24);
      doc.text(`TOTAL TICKETS ANALYZED: ${tickets.length}`, 135, 32);

      // KPI Parameters Section
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.text("1. Executive Key Performance Indicators", 15, 60);
      doc.line(15, 63, 195, 63);

      const pending = tickets.filter(t => ['Submitted', 'New', 'Pending', 'Draft'].includes(t.status)).length;
      const inProgress = tickets.filter(t => ['Assigned', 'In Progress', 'Under Review'].includes(t.status)).length;
      const resolved = tickets.filter(t => t.status === 'Resolved').length;
      const closed = tickets.filter(t => t.status === 'Closed').length;
      const escalated = tickets.filter(t => t.status === 'Escalated').length;
      const overdue = tickets.filter(t => {
        if (['Resolved', 'Closed', 'Rejected'].includes(t.status)) return false;
        const dueAt = t.sla_due_at ? new Date(t.sla_due_at) : new Date(new Date(t.created_at).getTime() + 72 * 3600000);
        return dueAt < new Date();
      }).length;

      doc.setFontSize(10);
      doc.text(`Total Filed Grievances: ${tickets.length}`, 15, 72);
      doc.text(`Pending Queue: ${pending}`, 15, 80);
      doc.text(`In-Progress Active: ${inProgress}`, 15, 88);
      doc.text(`Successfully Resolved: ${resolved}`, 115, 72);
      doc.text(`Closed & Verified: ${closed}`, 115, 80);
      doc.text(`Escalated Incidents: ${escalated}`, 115, 88);
      doc.text(`SLA Breached / Overdue: ${overdue}`, 15, 96);

      // Applied Filter Parameters
      doc.setFontSize(12);
      doc.text("2. Filter Parameters Applied", 15, 112);
      doc.line(15, 115, 195, 115);

      doc.setFontSize(9);
      doc.text(`Status Scope: ${filters.status || 'All Statuses'}`, 15, 124);
      doc.text(`Category Sector: ${filters.category || 'All Sectors'}`, 15, 131);
      doc.text(`Priority Level: ${filters.priority || 'All Priorities'}`, 115, 124);
      doc.text(`Department: ${filters.department || 'All Departments'}`, 115, 131);

      // Grievance Breakdown List Table
      doc.setFontSize(12);
      doc.text("3. Grievance Ticket Registry Audit", 15, 148);
      doc.line(15, 151, 195, 151);

      let yPos = 160;
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.text("TICKET ID", 15, yPos);
      doc.text("SUBJECT", 45, yPos);
      doc.text("CATEGORY", 110, yPos);
      doc.text("PRIORITY", 150, yPos);
      doc.text("STATUS", 175, yPos);
      doc.setFont(undefined, 'normal');

      yPos += 4;
      doc.line(15, yPos, 195, yPos);
      yPos += 6;

      const sampleTickets = tickets.slice(0, 15);
      sampleTickets.forEach((t) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        doc.text(String(t.ticket_id || '').substring(0, 14), 15, yPos);
        doc.text(String(t.title || '').substring(0, 32), 45, yPos);
        doc.text(String(t.category || '').substring(0, 20), 110, yPos);
        doc.text(String(t.urgency || ''), 150, yPos);
        doc.text(String(t.status || ''), 175, yPos);
        yPos += 7;
      });

      if (tickets.length > 15) {
        doc.setTextColor(100, 116, 139);
        doc.text(`... and ${tickets.length - 15} additional ticket records omitted from visual summary table.`, 15, yPos + 4);
      }

      // Page Footer
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(8);
        doc.text(`ResolveNow v2.0 Enterprise Governance System - Page ${i} of ${totalPages}`, 105, 290, null, null, 'center');
      }

      doc.save(filename);
      toast.success('Executive PDF summary report generated successfully.');
    } catch (err) {
      console.error(err);
      toast.error('PDF report generation failed: ' + err.message);
    }
  }
};
