import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  FileBarChart, FileDown, Download, Search, Calendar, Ticket, 
  CheckCircle2, Clock, AlertCircle, Activity, Filter, RefreshCw
} from 'lucide-react';
import { grievanceService } from '../../services/grievanceService';
import StatusBadge from '../../components/ui/StatusBadge';
import UrgencyBadge from '../../components/ui/UrgencyBadge';
import AnimatedPage from '../../components/ui/AnimatedPage';
import CounterCard from '../../components/ui/CounterCard';
import GlassPanel from '../../components/ui/GlassPanel';
import AnimatedButton from '../../components/ui/AnimatedButton';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

export const StudentReportsPage = ({ sessionUser }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const isDemo = sessionUser?.id?.startsWith('demo-');
      const data = isDemo 
        ? await grievanceService.getAll()
        : await grievanceService.getByUser(sessionUser.id);
      if (Array.isArray(data)) {
        setTickets(data);
      }
    } catch (err) {
      console.error('Failed to load report tickets:', err);
      toast.error('Could not load grievance records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [sessionUser?.id]);

  // Derived metrics
  const totalTickets = tickets.length;
  const pendingTickets = tickets.filter(t => ['Submitted', 'New', 'Pending', 'Draft'].includes(t.status)).length;
  const inProgressTickets = tickets.filter(t => ['Assigned', 'In Progress', 'Under Review'].includes(t.status)).length;
  const resolvedTickets = tickets.filter(t => ['Resolved', 'Closed'].includes(t.status)).length;
  const overdueTickets = tickets.filter(t => {
    if (['Resolved', 'Closed'].includes(t.status)) return false;
    const dueAt = t.sla_due_at ? new Date(t.sla_due_at) : new Date(new Date(t.created_at).getTime() + 72 * 3600000);
    return dueAt < new Date();
  }).length;

  const resolutionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 100;

  // Filter logic
  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.ticket_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (t.category && t.category.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;

    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && new Date(t.created_at) >= new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(t.created_at) <= end;
    }

    return matchesSearch && matchesStatus && matchesCategory && matchesDate;
  });

  // Export CSV Handler
  const handleExportCsv = () => {
    if (filteredTickets.length === 0) {
      toast.error('No grievance records to export.');
      return;
    }

    const headers = ['Ticket ID', 'Title', 'Category', 'Priority', 'Status', 'Filing Date', 'SLA Due Date', 'Resolution Notes'];
    const rows = filteredTickets.map(t => [
      `"${t.ticket_id}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.category || 'General'}"`,
      `"${t.urgency || 'Medium'}"`,
      `"${t.status}"`,
      `"${new Date(t.created_at).toLocaleString()}"`,
      `"${t.sla_due_at ? new Date(t.sla_due_at).toLocaleString() : 'N/A'}"`,
      `"${(t.resolution_notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ResolveNow_Grievance_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Report exported successfully.');
  };

  // Export Summary PDF Handler
  const handleExportSummaryPdf = async () => {
    if (filteredTickets.length === 0) {
      toast.error('No grievance records to export.');
      return;
    }

    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 42, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text("RESOLVENOW STUDENT GRIEVANCE REPORT", 15, 22);
      doc.setFontSize(10);
      doc.text(`STUDENT: ${sessionUser?.fullName || sessionUser?.email || 'Student'}`, 15, 30);
      doc.text(`GENERATED: ${new Date().toLocaleDateString()}`, 145, 30);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.text("1. Performance Summary", 15, 54);
      doc.line(15, 56, 195, 56);

      doc.setFontSize(10);
      doc.text(`Total Filed: ${totalTickets}`, 15, 66);
      doc.text(`Pending: ${pendingTickets}`, 70, 66);
      doc.text(`In Progress: ${inProgressTickets}`, 120, 66);
      doc.text(`Resolved: ${resolvedTickets}`, 165, 66);

      doc.text(`SLA Overdue: ${overdueTickets}`, 15, 74);
      doc.text(`Resolution Success Rate: ${resolutionRate}%`, 70, 74);

      doc.setFontSize(12);
      doc.text("2. Grievance History Records", 15, 90);
      doc.line(15, 92, 195, 92);

      let yPos = 102;
      doc.setFontSize(9);

      filteredTickets.slice(0, 15).forEach((t, i) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.text(`#${t.ticket_id} - ${t.title.substring(0, 40)}`, 15, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(`Category: ${t.category} | Priority: ${t.urgency} | Status: ${t.status}`, 15, yPos + 5);
        doc.text(`Filed: ${new Date(t.created_at).toLocaleDateString()}`, 150, yPos);
        yPos += 14;
        doc.setDrawColor(226, 232, 240);
        doc.line(15, yPos - 4, 195, yPos - 4);
      });

      doc.save(`ResolveNow_Student_Summary_${Date.now()}.pdf`);
      toast.success("PDF Summary Report generated successfully.");
    } catch (err) {
      toast.error("Failed to generate PDF summary report.");
    }
  };

  // Export Single Ticket PDF Handler
  const handleExportSinglePdf = async (ticket) => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 42, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("RESOLVENOW GRIEVANCE DOSSIER", 15, 24);
      doc.setFontSize(10);
      doc.text(`TICKET: #${ticket.ticket_id}`, 145, 24);
      doc.text(`DATE: ${new Date().toLocaleDateString()}`, 145, 31);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.text("1. Grievance Overview", 15, 54);
      doc.line(15, 57, 195, 57);

      doc.setFontSize(10);
      doc.text(`Subject: ${ticket.title}`, 15, 66);
      doc.text(`Category: ${ticket.category}`, 15, 74);
      doc.text(`Priority: ${ticket.urgency}`, 15, 82);
      doc.text(`Status: ${ticket.status}`, 120, 82);
      doc.text(`Filing Date: ${new Date(ticket.created_at).toLocaleString()}`, 15, 90);

      doc.setFontSize(12);
      doc.text("2. Statement", 15, 106);
      doc.line(15, 109, 195, 109);
      doc.setFontSize(10);
      const splitDesc = doc.splitTextToSize(ticket.description, 180);
      doc.text(splitDesc, 15, 118);

      if (ticket.resolution_notes) {
        const yOffset = 130 + (splitDesc.length * 5);
        doc.setFillColor(240, 253, 250);
        doc.rect(15, yOffset, 180, 28, 'F');
        doc.setTextColor(13, 148, 136);
        doc.setFontSize(11);
        doc.text("Resolution Audit Statement", 20, yOffset + 8);
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        const splitNotes = doc.splitTextToSize(ticket.resolution_notes, 170);
        doc.text(splitNotes, 20, yOffset + 16);
      }

      doc.save(`ResolveNow_Dossier_${ticket.ticket_id}.pdf`);
      toast.success(`Dossier #${ticket.ticket_id} exported.`);
    } catch {
      toast.error("PDF export failed.");
    }
  };

  return (
    <AnimatedPage className="space-y-8 text-left max-w-7xl mx-auto pb-16">
      
      {/* 1. Page Header */}
      <GlassPanel className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-mono font-bold text-indigo-400">
              <FileBarChart size={13} />
              <span>Student Reports & History Export</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-heading font-black text-white uppercase tracking-tight">
              Grievance Dossier & Audit Center
            </h1>
            <p className="text-xs md:text-sm text-slate-400 font-medium">
              Download formal PDF dossiers, export CSV data records, and analyze resolution compliance timelines.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <AnimatedButton
              variant="secondary"
              size="md"
              leftIcon={Download}
              onClick={handleExportCsv}
            >
              Export CSV
            </AnimatedButton>
            <AnimatedButton
              variant="glow"
              size="md"
              leftIcon={FileDown}
              onClick={handleExportSummaryPdf}
            >
              Export Summary PDF
            </AnimatedButton>
          </div>
        </div>
      </GlassPanel>

      {/* 2. KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <CounterCard title="Total Grievances" value={totalTickets} icon={Ticket} iconColor="text-indigo-400" />
        <CounterCard title="Pending" value={pendingTickets} icon={Clock} iconColor="text-amber-400" />
        <CounterCard title="In Progress" value={inProgressTickets} icon={Activity} iconColor="text-cyan-400" />
        <CounterCard title="Resolved" value={resolvedTickets} icon={CheckCircle2} iconColor="text-emerald-400" />
        <CounterCard title="SLA Overdue" value={overdueTickets} icon={AlertCircle} iconColor="text-rose-500" />
      </div>

      {/* 3. Filterable Table Panel */}
      <GlassPanel className="p-0 overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-white/10 bg-slate-950/40 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                Grievance Report Records ({filteredTickets.length})
              </h3>
              <p className="text-xs text-slate-400">
                Filter by date, category, status, or search keywords
              </p>
            </div>

            <button 
              onClick={fetchTickets}
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors self-start md:self-auto flex items-center gap-1.5 text-xs font-mono"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>Refresh Records</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
            {/* Search Input */}
            <div className="relative bg-slate-900 border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
              <Search size={14} className="text-slate-400" />
              <input 
                type="text"
                placeholder="Search Subject or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-white placeholder:text-slate-500 w-full"
              />
            </div>

            {/* Status Select */}
            <div className="relative bg-slate-900 border border-white/10 rounded-xl px-3 py-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs text-white outline-none w-full cursor-pointer"
              >
                <option value="All" className="bg-slate-900">All Statuses</option>
                <option value="Submitted" className="bg-slate-900">Submitted</option>
                <option value="Assigned" className="bg-slate-900">Assigned</option>
                <option value="In Progress" className="bg-slate-900">In Progress</option>
                <option value="Escalated" className="bg-slate-900">Escalated</option>
                <option value="Resolved" className="bg-slate-900">Resolved</option>
                <option value="Closed" className="bg-slate-900">Closed</option>
              </select>
            </div>

            {/* Category Select */}
            <div className="relative bg-slate-900 border border-white/10 rounded-xl px-3 py-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent text-xs text-white outline-none w-full cursor-pointer"
              >
                <option value="All" className="bg-slate-900">All Categories</option>
                <option value="IT Support" className="bg-slate-900">IT Support</option>
                <option value="Academic" className="bg-slate-900">Academic</option>
                <option value="Hostel & Mess" className="bg-slate-900">Hostel & Mess</option>
                <option value="Finance & Fee" className="bg-slate-900">Finance & Fee</option>
                <option value="Administration" className="bg-slate-900">Administration</option>
              </select>
            </div>

            {/* Start Date */}
            <div className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <Calendar size={14} className="text-slate-400 shrink-0" />
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-white w-full"
                title="Filter From Date"
              />
            </div>

            {/* End Date */}
            <div className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <Calendar size={14} className="text-slate-400 shrink-0" />
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-white w-full"
                title="Filter To Date"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-950/60 text-[10px] font-mono uppercase text-slate-400 tracking-wider font-bold border-b border-white/10">
                <th className="px-6 py-3.5">Ticket Reference</th>
                <th className="px-6 py-3.5">Subject Title</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Priority</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Filing Date</th>
                <th className="px-6 py-3.5 text-right">Dossier PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12">
                    <LoadingSkeleton variant="list" count={4} />
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500 italic">
                    No grievance records match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-indigo-400">
                      #{t.ticket_id}
                    </td>
                    <td className="px-6 py-4 font-bold text-white max-w-xs truncate">
                      {t.title}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {t.category}
                    </td>
                    <td className="px-6 py-4">
                      <UrgencyBadge level={t.urgency} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleExportSinglePdf(t)}
                        className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-all border border-indigo-500/20 flex items-center gap-1 ml-auto text-[10px] font-bold uppercase tracking-wider"
                        title="Download Dossier PDF"
                      >
                        <FileDown size={13} />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassPanel>
    </AnimatedPage>
  );
};

export default StudentReportsPage;
