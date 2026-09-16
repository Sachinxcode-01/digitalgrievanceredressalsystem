import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, Download, Copy, ExternalLink, Printer, 
  Smartphone, ShieldCheck, Check, Sparkles, X 
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * TicketQrCodeBadge
 * Generates an instant, client-side, zero-network QR code for any grievance ticket.
 * Allows instant smartphone camera scanning, 1-click PNG pass download, and direct link copying.
 * 
 * @param {Object} props
 * @param {Object} props.ticket - The grievance ticket object
 * @param {string} [props.variant='card'] - 'card' | 'badge' | 'compact'
 * @param {string} [props.className=''] - Additional container styling classes
 */
export const TicketQrCodeBadge = ({ ticket, variant = 'card', className = '' }) => {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);

  const ticketId = ticket?.ticket_id || ticket?.id || 'TICKET-ID';
  
  // Construct dynamic deep link to public tracking portal
  const trackingUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/track?ticket=${encodeURIComponent(ticketId)}`
    : `https://resolvenow.campus.edu/track?ticket=${encodeURIComponent(ticketId)}`;

  useEffect(() => {
    let isMounted = true;
    if (!ticket) return;

    setIsGenerating(true);
    QRCode.toDataURL(trackingUrl, {
      width: 360,
      margin: 2,
      errorCorrectionLevel: 'H', // High error correction for robust mobile scanning
      color: {
        dark: '#090d16',
        light: '#ffffff'
      }
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setIsGenerating(false);
        }
      })
      .catch((err) => {
        console.error('Failed to render QR Code:', err);
        if (isMounted) setIsGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [ticket, trackingUrl]);

  if (!ticket) return null;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(trackingUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = trackingUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      toast.success('Mobile tracking link copied!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Unable to copy link.');
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `resolvenow-${ticketId}-qr-pass.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('QR Pass saved to downloads!');
  };

  const handlePrint = () => {
    window.print();
  };

  // Compact Pill / Modal Trigger Variant
  if (variant === 'badge' || variant === 'compact') {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold transition-all duration-200 cursor-pointer shadow-sm hover:shadow-indigo-500/20 ${className}`}
          title="Open Mobile QR Tracking Pass"
        >
          <QrCode size={14} className="text-indigo-400" />
          <span>QR Pass</span>
        </button>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-sm rounded-3xl bg-slate-950 border border-indigo-500/30 p-6 shadow-2xl space-y-5 text-center">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                  <ShieldCheck size={12} /> Verified Mobile Pass
                </div>
                <h3 className="text-lg font-heading font-black text-white tracking-wide">
                  Scan to Track Ticket
                </h3>
                <p className="text-xs text-slate-400 font-mono">#{ticketId}</p>
              </div>

              {/* QR Image Box with Viewfinder Styling */}
              <div className="relative mx-auto w-52 h-52 bg-white rounded-2xl p-2.5 shadow-xl flex items-center justify-center border-4 border-slate-900 group">
                {/* Viewfinder Corners */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-indigo-500" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-indigo-500" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-indigo-500" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-indigo-500" />

                {isGenerating || !qrDataUrl ? (
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                ) : (
                  <img
                    src={qrDataUrl}
                    alt={`QR Tracking Pass for ${ticketId}`}
                    className="w-full h-full object-contain rounded-lg"
                  />
                )}
              </div>

              <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                <Smartphone size={14} className="text-indigo-400 shrink-0" />
                <span>Scan with any smartphone camera for instant live status.</span>
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Download size={13} />
                  <span>Save Pass</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Full Interactive Card Variant
  return (
    <div className={`p-5 rounded-2xl bg-slate-950/90 border border-indigo-500/20 shadow-xl text-left space-y-4 relative overflow-hidden group ${className}`}>
      {/* Subtle background glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <QrCode size={16} />
          </div>
          <div>
            <h4 className="text-xs font-heading font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              Instant Mobile QR Pass
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Live Sync
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Scan with phone camera or save offline image to track resolution without retyping ticket ID.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownloadQr}
            className="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            title="Download QR code PNG image"
          >
            <Download size={13} />
            <span>Download PNG</span>
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            title="Copy direct tracking link"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy URL'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-5 pt-1">
        {/* Crisp QR Code Container with Frame */}
        <div className="relative shrink-0 w-36 h-36 bg-white rounded-2xl p-2 shadow-xl border-2 border-indigo-500/30 flex items-center justify-center">
          {/* Frame accents */}
          <div className="absolute -top-1 -left-1 w-3.5 h-3.5 border-t-2 border-l-2 border-indigo-500" />
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 border-t-2 border-r-2 border-indigo-500" />
          <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 border-b-2 border-l-2 border-indigo-500" />
          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 border-b-2 border-r-2 border-indigo-500" />

          {isGenerating || !qrDataUrl ? (
            <div className="w-6 h-6 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          ) : (
            <img
              src={qrDataUrl}
              alt={`QR code for ticket ${ticketId}`}
              className="w-full h-full object-contain rounded-lg"
            />
          )}
        </div>

        {/* Info / instructions */}
        <div className="space-y-2 text-xs w-full">
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider block">
              Embedded Gateway URL
            </span>
            <span className="font-mono text-indigo-300 text-[11px] truncate block max-w-sm sm:max-w-md">
              {trackingUrl}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <Smartphone size={13} className="text-emerald-400 shrink-0" />
              <span>Zero app download required</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={13} className="text-cyan-400 shrink-0" />
              <span>SHA-256 Verified Public Record</span>
            </div>
          </div>

          <div className="pt-1 flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="text-[11px] text-slate-400 hover:text-slate-200 underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <Printer size={12} />
              <span>Print physical docket receipt</span>
            </button>
            <a
              href={trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              <span>Test tracking link</span>
              <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketQrCodeBadge;
