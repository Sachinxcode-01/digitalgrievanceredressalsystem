import React, { useState } from 'react';
import { MessageCircle, Phone, CheckCircle2, BellRing, Sparkles, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export const SmsWhatsAppOptInCard = ({ ticketId, currentPhone = '' }) => {
  const [phoneNumber, setPhoneNumber] = useState(currentPhone || '');
  const [channel, setChannel] = useState('whatsapp'); // 'whatsapp' or 'sms'
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.trim().length < 10) {
      toast.error('Please enter a valid 10-digit mobile phone number.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsSubscribed(true);
      toast.success(
        channel === 'whatsapp'
          ? `Subscribed to WhatsApp alerts on ${phoneNumber}! 📱`
          : `Subscribed to SMS text alerts on ${phoneNumber}! 💬`
      );
    }, 600);
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-surface/90 border border-border shadow-md space-y-3 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <MessageCircle size={16} />
          </div>
          <div>
            <h4 className="text-xs font-heading font-bold text-foreground">
              WhatsApp & SMS Milestone Notifications
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Receive direct pings whenever an officer inspects or resolves your complaint.
            </p>
          </div>
        </div>

        {isSubscribed && (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 size={10} /> Active
          </span>
        )}
      </div>

      {!isSubscribed ? (
        <form onSubmit={handleSubscribe} className="space-y-3 pt-1">
          <div className="flex items-center gap-2">
            {/* Channel Toggles */}
            <button
              type="button"
              onClick={() => setChannel('whatsapp')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                channel === 'whatsapp'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'bg-background text-muted-foreground border border-border'
              }`}
            >
              <MessageCircle size={13} />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => setChannel('sms')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                channel === 'sms'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                  : 'bg-background text-muted-foreground border border-border'
              }`}
            >
              <Phone size={13} />
              <span>SMS Text</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">
                +91
              </span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter 10-digit mobile number"
                className="w-full pl-11 pr-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary font-mono"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-bright text-primary-foreground font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all shrink-0"
            >
              <Send size={12} />
              <span>{loading ? 'Subscribing...' : 'Subscribe'}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
          <span>📲 Alerts subscribed for <b>+91 {phoneNumber}</b> via <b>{channel.toUpperCase()}</b>.</span>
          <button
            type="button"
            onClick={() => setIsSubscribed(false)}
            className="text-[10px] text-muted-foreground hover:text-foreground underline cursor-pointer"
          >
            Change Number
          </button>
        </div>
      )}
    </div>
  );
};

export default SmsWhatsAppOptInCard;
