import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Send, Phone, MessageSquare, Check, CheckCheck, 
  ExternalLink, Sparkles, Star, ThumbsUp, ShieldCheck, 
  RefreshCw, Radio, Bell, Smartphone, Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import { messagingService } from '../../services/messagingService';

export const MobileNotificationSimulatorModal = ({ isOpen, onClose, ticket, defaultChannel = 'whatsapp' }) => {
  const [activeChannel, setActiveChannel] = useState(defaultChannel); // whatsapp, telegram, sms
  const [recipient, setRecipient] = useState('+91 98765 43210');
  const [customNote, setCustomNote] = useState('');
  const [eventType, setEventType] = useState('status_update');
  const [isSending, setIsSending] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [isSimulatingCitizen, setIsSimulatingCitizen] = useState(false);

  const activeTicket = ticket || {
    id: 'demo-ticket',
    ticket_id: 'TKT-2026-8942',
    title: 'Hostel Water Supply & Pressure Disruption',
    status: 'In Progress',
    department: 'Facilities & Maintenance',
    urgency: 'High',
    upvote_count: 5
  };

  // Generate initial outbound message for simulator
  const generateInitialMessage = () => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const trackingUrl = `${window.location.origin}/track?token=${encodeURIComponent(activeTicket.ticket_id || activeTicket.id)}`;

    if (activeChannel === 'whatsapp') {
      return {
        id: 'msg-init-wa',
        sender: 'system',
        time: timestamp,
        header: '🏛️ Digital Grievance Redressal System',
        body: `Hello,\n\nYour grievance *#${activeTicket.ticket_id}* regarding _"${activeTicket.title}"_ is currently *${activeTicket.status}*.\n\n🏢 *Department:* ${activeTicket.department || 'General'}\n⚡ *Urgency:* ${activeTicket.urgency || 'Medium'}`,
        buttons: [
          { text: '📍 View Live Milestones', url: trackingUrl, type: 'url' },
          { text: '👍 Acknowledge', action: 'acknowledge', type: 'btn' },
          { text: '⭐ Rate 5 Stars', action: 'rate', type: 'btn' }
        ]
      };
    } else if (activeChannel === 'telegram') {
      return {
        id: 'msg-init-tg',
        sender: 'system',
        time: timestamp,
        text: `🏛 *ResolveNow Institutional Bot*\n\n📋 *Ticket Reference:* \`#${activeTicket.ticket_id}\`\n📝 *Subject:* ${activeTicket.title}\n📊 *Status:* \`${activeTicket.status}\`\n🏢 *Department:* ${activeTicket.department || 'General'}`,
        buttons: [
          { text: '📍 Track Milestones', url: trackingUrl, type: 'url' },
          { text: '✅ Acknowledge', action: 'acknowledge', type: 'btn' },
          { text: '⭐ Rate 5★', action: 'rate', type: 'btn' }
        ]
      };
    } else {
      return {
        id: 'msg-init-sms',
        sender: 'system',
        time: timestamp,
        text: `[ResolveNow] Ticket #${activeTicket.ticket_id}: Status is '${activeTicket.status}'. Track live: ${trackingUrl}`,
        shortUrl: trackingUrl
      };
    }
  };

  useEffect(() => {
    if (isOpen) {
      setChatHistory([generateInitialMessage()]);
    }
  }, [isOpen, activeChannel, ticket]);

  const handleDispatch = async () => {
    setIsSending(true);
    try {
      const res = await messagingService.dispatchMessage({
        channel: activeChannel,
        recipient,
        ticket: activeTicket,
        eventType,
        customNote
      });

      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newMessage = {
        id: 'msg-' + Date.now(),
        sender: 'system',
        time: timestamp,
        body: customNote 
          ? `📢 *Official Dispatch:*\nStatus: ${activeTicket.status}\nNote: "${customNote}"`
          : `Update for ticket #${activeTicket.ticket_id}: Status is ${activeTicket.status}.`,
        text: customNote ? `📢 *Official Update:*\n${customNote}` : `Status update: ${activeTicket.status}`,
        buttons: activeChannel !== 'sms' ? [
          { text: '📍 View Live Milestones', url: `${window.location.origin}/track?token=${activeTicket.ticket_id}`, type: 'url' },
          { text: '👍 Acknowledge', action: 'acknowledge', type: 'btn' }
        ] : null
      };

      setChatHistory(prev => [...prev, newMessage]);
      setCustomNote('');
      toast.success(`📲 Dispatched direct ${activeChannel.toUpperCase()} webhook!`);
    } catch (err) {
      toast.error('Dispatch failed: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleCitizenAction = async (action, rating = 5) => {
    setIsSimulatingCitizen(true);
    try {
      await messagingService.simulateCitizenResponse({
        ticketId: activeTicket.id || activeTicket.ticket_id,
        actionType: action,
        rating,
        comment: action === 'rate' ? 'Rapid resolution via digital system.' : 'Acknowledged on WhatsApp'
      });

      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const replyMessage = {
        id: 'reply-' + Date.now(),
        sender: 'citizen',
        time: timestamp,
        text: action === 'acknowledge'
          ? '👍 I acknowledge receipt of this update. Thank you.'
          : `⭐ Rating Submitted: 5/5 Stars! (Resolution verified).`
      };

      setChatHistory(prev => [...prev, replyMessage]);
      toast.success(`Citizen interactive response received!`);
    } catch (err) {
      toast.error('Simulation error: ' + err.message);
    } finally {
      setIsSimulatingCitizen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-linear-to-r from-slate-950 via-slate-900 to-indigo-950/80 border-b border-white/10 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <Smartphone size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-tight">
                  Mobile Direct Webhook & Live SMS Simulator
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Interactive Node
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time WhatsApp, Telegram Bot, & Carrier SMS alerts with 1-click citizen actions.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 border border-white/10 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Channel Selector Bar */}
        <div className="px-6 py-3 bg-slate-950/70 border-b border-white/10 flex items-center justify-between gap-4 shrink-0 flex-wrap">
          <div className="flex items-center gap-2">
            {[
              { id: 'whatsapp', label: 'WhatsApp Webhook', icon: MessageSquare, color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' },
              { id: 'telegram', label: 'Telegram Bot API', icon: Send, color: 'text-sky-400 border-sky-500/40 bg-sky-500/10' },
              { id: 'sms', label: 'Carrier SMS', icon: Phone, color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' }
            ].map(channel => {
              const Icon = channel.icon;
              const isSelected = activeChannel === channel.id;
              return (
                <button
                  key={channel.id}
                  onClick={() => setActiveChannel(channel.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                    isSelected
                      ? channel.color + ' ring-1 ring-white/20'
                      : 'border-white/10 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon size={13} />
                  <span>{channel.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span className="hidden sm:inline text-[11px] uppercase">Active Target:</span>
            <span className="text-white font-bold">{activeTicket.ticket_id}</span>
          </div>
        </div>

        {/* Content Body: Split Screen (Dispatch Controls on Left, Realistic Mobile Simulator on Right) */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 bg-slate-950/30">
          
          {/* LEFT: Dispatch & Webhook Controls (5 cols) */}
          <div className="md:col-span-5 space-y-4 text-left">
            <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-3">
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">
                Webhook Trigger Parameters
              </h3>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Recipient Phone / Handle
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Milestone Event Trigger
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer focus:border-indigo-500"
                >
                  <option value="status_update">Status Update (In Progress / Assigned)</option>
                  <option value="created">New Registration Confirmation</option>
                  <option value="escalated">SLA Breach Escalation Warning</option>
                  <option value="resolved">Resolution Notice & Citizen Feedback</option>
                  <option value="petition_upvoted">Community Petition Endorsement</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Official Officer Note (Optional)
                </label>
                <textarea
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="e.g. Field inspection completed. Power line repair underway."
                  rows={2}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none resize-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={handleDispatch}
                disabled={isSending}
                className="w-full py-2.5 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-50 transition-all"
              >
                {isSending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                <span>Transmit Mobile Webhook</span>
              </button>
            </div>

            {/* Direct 1-Click Interactive Citizen Simulation Buttons */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                Simulate Inbound Citizen Actions
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleCitizenAction('acknowledge')}
                  disabled={isSimulatingCitizen}
                  className="p-2.5 rounded-xl bg-slate-950 border border-white/10 hover:border-emerald-500/40 text-xs font-bold text-slate-200 hover:text-emerald-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <ThumbsUp size={13} className="text-emerald-400" />
                  <span>Acknowledge</span>
                </button>
                <button
                  onClick={() => handleCitizenAction('rate', 5)}
                  disabled={isSimulatingCitizen}
                  className="p-2.5 rounded-xl bg-slate-950 border border-white/10 hover:border-amber-500/40 text-xs font-bold text-slate-200 hover:text-amber-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Star size={13} className="text-amber-400" />
                  <span>Rate 5 Stars</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: High-Fidelity Smartphone Device Mockup (7 cols) */}
          <div className="md:col-span-7 flex items-center justify-center">
            <div className="w-full max-w-sm rounded-[36px] bg-slate-950 p-3 shadow-2xl border-4 border-slate-800 shadow-indigo-500/10 relative overflow-hidden">
              
              {/* Dynamic Island / Camera Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-20 flex items-center justify-end px-2">
                <div className="w-2 h-2 rounded-full bg-blue-950 border border-blue-800/80" />
              </div>

              {/* Smartphone Screen Viewport */}
              <div className={`rounded-[28px] overflow-hidden flex flex-col h-115 border border-white/5 ${
                activeChannel === 'whatsapp' 
                  ? 'bg-slate-950 bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-size-[16px_16px]'
                  : activeChannel === 'telegram'
                  ? 'bg-slate-950'
                  : 'bg-slate-900'
              }`}>
                
                {/* App Top Bar */}
                <div className={`px-4 pt-6 pb-2.5 border-b flex items-center justify-between shrink-0 ${
                  activeChannel === 'whatsapp'
                    ? 'bg-slate-900 border-emerald-500/20 text-white'
                    : activeChannel === 'telegram'
                    ? 'bg-slate-900 border-sky-500/20 text-white'
                    : 'bg-slate-900 border-white/10 text-white'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-linear-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-xs shadow-xs">
                      R
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold">ResolveNow Bot</span>
                        <ShieldCheck size={11} className="text-emerald-400" />
                      </div>
                      <span className="text-[9px] text-emerald-400 font-mono block">Official Verified Channel</span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Message Stream */}
                <div className="p-3.5 space-y-3 flex-1 overflow-y-auto">
                  {chatHistory.map((msg, i) => {
                    const isSystem = msg.sender === 'system';
                    return (
                      <motion.div
                        key={msg.id || i}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col ${isSystem ? 'items-start' : 'items-end'}`}
                      >
                        <div className={`max-w-[88%] p-3 rounded-2xl text-xs space-y-2 shadow-md ${
                          isSystem
                            ? activeChannel === 'whatsapp'
                              ? 'bg-slate-900/90 text-slate-100 border border-emerald-500/30'
                              : activeChannel === 'telegram'
                              ? 'bg-slate-900 text-slate-100 border border-sky-500/30'
                              : 'bg-slate-850 text-slate-100 border border-white/10'
                            : 'bg-emerald-600 text-white'
                        }`}>
                          {msg.header && (
                            <p className="font-bold text-[11px] text-amber-300 pb-1 border-b border-white/10">
                              {msg.header}
                            </p>
                          )}

                          <p className="whitespace-pre-wrap leading-relaxed">
                            {msg.body || msg.text}
                          </p>

                          <div className="flex items-center justify-end gap-1 text-[9px] text-slate-400 pt-1">
                            <span>{msg.time}</span>
                            {isSystem && <CheckCheck size={11} className="text-sky-400" />}
                          </div>
                        </div>

                        {/* Interactive Buttons (WhatsApp / Telegram) */}
                        {isSystem && msg.buttons && msg.buttons.length > 0 && (
                          <div className="w-[88%] space-y-1.5 mt-1.5">
                            {msg.buttons.map((btn, bIdx) => (
                              <button
                                key={bIdx}
                                onClick={() => {
                                  if (btn.url) window.open(btn.url, '_blank');
                                  else if (btn.action) handleCitizenAction(btn.action);
                                }}
                                className="w-full py-1.5 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-[11px] font-bold text-indigo-300 hover:text-white flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                              >
                                {btn.url && <ExternalLink size={11} />}
                                <span>{btn.text}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Input Bar Placeholder */}
                <div className="p-2.5 bg-slate-900 border-t border-white/10 flex items-center gap-2">
                  <input
                    type="text"
                    disabled
                    placeholder="Reply as citizen..."
                    className="flex-1 bg-slate-950 rounded-xl px-3 py-1.5 text-xs text-slate-500 outline-none"
                  />
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Send size={12} />
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Engine: WhatsApp Cloud API & Telegram Bot Gateway</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Close Simulator
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default MobileNotificationSimulatorModal;
