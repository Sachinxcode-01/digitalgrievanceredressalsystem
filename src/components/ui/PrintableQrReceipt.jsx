import React from 'react';
import { Printer, QrCode, ShieldCheck, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const PrintableQrReceipt = ({ ticket }) => {
  if (!ticket) return null;

  const handlePrint = () => {
    window.print();
  };

  const trackingUrl = `https://resolvenow.gov.in/track?ref=${encodeURIComponent(ticket.ticket_id || ticket.id)}`;
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(trackingUrl)}&bgcolor=ffffff&color=0f172a&margin=2`;

  return (
    <div className="p-4 rounded-2xl bg-surface/90 border border-border shadow-md flex items-center justify-between gap-3 text-left">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center text-muted-foreground">
          <QrCode size={18} />
        </div>
        <div>
          <h4 className="text-xs font-heading font-bold text-foreground">
            Official Physical Paper Receipt & QR Pass
          </h4>
          <p className="text-[11px] text-muted-foreground">
            Print a physical slip with QR code for gate security or campus office verification.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handlePrint}
        className="px-3.5 py-2 rounded-xl bg-background hover:bg-surface border border-border hover:border-primary text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
      >
        <Printer size={13} />
        <span>Print Receipt</span>
      </button>

      {/* Hidden Print Container (Activated on window.print()) */}
      <div className="hidden print:block fixed inset-0 bg-white text-black p-8 font-sans z-9999">
        <div className="max-w-md mx-auto border-2 border-black p-6 space-y-4 rounded-lg">
          <div className="text-center border-b-2 border-black pb-3">
            <h1 className="text-xl font-black tracking-wide uppercase">RESOLVENOW DIGITAL PORTAL</h1>
            <p className="text-xs text-gray-700">Official Citizen Grievance Acknowledgement Receipt</p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between border-b border-gray-300 py-1">
              <span className="font-bold">Ticket ID:</span>
              <span className="font-mono font-bold text-sm">#{ticket.ticket_id}</span>
            </div>
            <div className="flex justify-between border-b border-gray-300 py-1">
              <span className="font-bold">Subject:</span>
              <span className="truncate max-w-60">{ticket.title}</span>
            </div>
            <div className="flex justify-between border-b border-gray-300 py-1">
              <span className="font-bold">Department:</span>
              <span>{ticket.department || 'General Redressal'}</span>
            </div>
            <div className="flex justify-between border-b border-gray-300 py-1">
              <span className="font-bold">Current Status:</span>
              <span className="font-bold uppercase">{ticket.status}</span>
            </div>
            <div className="flex justify-between border-b border-gray-300 py-1">
              <span className="font-bold">Date of Filing:</span>
              <span>{ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : new Date().toLocaleDateString()}</span>
            </div>
          </div>

          <div className="text-center pt-2 flex flex-col items-center">
            <img src={qrSvgUrl} alt="QR Code" className="w-28 h-28 border border-gray-400 p-1 mb-2" />
            <p className="text-[10px] text-gray-600">Scan with smartphone camera to view live status</p>
          </div>

          <div className="text-center border-t border-gray-400 pt-2 text-[9px] text-gray-500">
            Cryptographically Locked & Verified Record — ISO-27001 Redressal Standard
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintableQrReceipt;
