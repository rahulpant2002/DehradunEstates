import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { usePropertyStore } from '../stores/usePropertyStore';
import { formatPrice } from '../lib/utils';
import { PROPERTY_TYPE_LABELS } from '../lib/constants';
import type { Property, PropertyFilters, PropertyType } from '../types';

interface Msg {
  role: 'user' | 'bot';
  text: string;
  properties?: Property[];
}

const TYPES: PropertyType[] = ['apartment', 'house', 'villa', 'plot', 'commercial'];

const GREETING: Msg = {
  role: 'bot',
  text:
    "Hi! I'm the DehradunEstates assistant 🏡\nI can help you find properties and explain how things work. Try:\n• \"show 2bhk apartments for rent\"\n• \"villas under 2 crore\"\n• \"how do I list my property?\"\n• \"how does buying work?\"",
};

// Parse a free-text query into property filters.
function buildFilters(t: string): { filters: PropertyFilters; isSearch: boolean } {
  const filters: PropertyFilters = {};
  let isSearch = false;

  const type = TYPES.find((ty) => t.includes(ty) || (ty === 'apartment' && /\bflat\b/.test(t)));
  if (type) { filters.property_type = type; isSearch = true; }

  if (/\brent(al)?\b/.test(t)) { filters.price_type = 'rent'; isSearch = true; }
  else if (/\b(buy|sale|purchase|for sale)\b/.test(t)) { filters.price_type = 'sale'; isSearch = true; }

  const bhk = t.match(/(\d+)\s*(?:bhk|bed)/);
  if (bhk) { filters.bedrooms = parseInt(bhk[1]); isSearch = true; }

  const price = t.match(/(?:under|below|less than|upto|up to|max|within)\s*(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?)\s*(crore|cr|lakh|lac|l|k)?/);
  if (price) {
    let n = parseFloat(price[1]);
    const u = price[2];
    if (u === 'crore' || u === 'cr') n *= 1e7;
    else if (u === 'lakh' || u === 'lac' || u === 'l') n *= 1e5;
    else if (u === 'k') n *= 1e3;
    filters.max_price = n; isSearch = true;
  }

  if (/\b(show|find|list|looking|search|properties|property|available|near|want)\b/.test(t)) isSearch = true;
  return { filters, isSearch };
}

export default function ChatBot() {
  const { queryProperties } = usePropertyStore();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, open]);

  const reply = async (text: string): Promise<Msg> => {
    const t = text.toLowerCase().trim();

    if (/\b(hi|hello|hey|help)\b/.test(t) && t.length < 20) {
      return { role: 'bot', text: GREETING.text };
    }
    if (/(how|where).*(list|sell|add)/.test(t) || /\b(list|sell|add)\b.*(propert|home|flat|house)/.test(t)) {
      return { role: 'bot', text: 'To list a property: sign in → click "Sell Property" (top-right) → add details and upload photos/videos. It goes live instantly and appears under "My Listings".' };
    }
    if (/(how|what).*(buy|interest|purchas)/.test(t) || (/\bbuy\b/.test(t) && /work|do/.test(t))) {
      return { role: 'bot', text: 'Open any property and click "Buy this Property". The owner is notified (🔔 bell + "My Listings") and gets your contact details to reach out. Your interests are saved under "My Interests".' };
    }
    if (/notif|bell/.test(t)) {
      return { role: 'bot', text: 'When someone shows interest in one of your listings, it appears in the 🔔 bell at the top — with the interested buyer\'s name and contact info, so you can follow up.' };
    }

    const { filters, isSearch } = buildFilters(t);
    if (isSearch) {
      try {
        const results = await queryProperties(filters, 6);
        if (results.length === 0) {
          return { role: 'bot', text: "I couldn't find any matching properties. Try widening the criteria, or use the Browse page for the full list." };
        }
        const bits = [
          filters.bedrooms ? `${filters.bedrooms}+ BHK` : '',
          filters.property_type ? PROPERTY_TYPE_LABELS[filters.property_type] : '',
          filters.price_type ? `for ${filters.price_type}` : '',
          filters.max_price ? `under ${formatPrice(filters.max_price, 'sale')}` : '',
        ].filter(Boolean).join(' ');
        return {
          role: 'bot',
          text: `Found ${results.length} propert${results.length === 1 ? 'y' : 'ies'}${bits ? ` (${bits})` : ''}:`,
          properties: results,
        };
      } catch {
        return { role: 'bot', text: 'Sorry, I had trouble searching just now. Please try again.' };
      }
    }

    return { role: 'bot', text: 'I can search properties (e.g. "3bhk house under 1 crore", "apartments for rent") or explain how to list, buy, and get notified. What would you like to do?' };
  };

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text }]);
    setBusy(true);
    const res = await reply(text);
    setMessages((m) => [...m, res]);
    setBusy(false);
  };

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open assistant"
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg flex items-center justify-center transition-colors"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[22rem] max-w-[calc(100vw-2.5rem)] h-[28rem] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-900 shadow-2xl animate-scale-in overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-primary-600 text-white">
            <Bot className="w-5 h-5" />
            <span className="font-semibold text-sm">Property Assistant</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-surface-50 dark:bg-surface-950/40">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-line ${m.role === 'user' ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-white dark:bg-surface-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-sm'}`}>
                  {m.text}
                  {m.properties && m.properties.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {m.properties.map((p) => (
                        <Link
                          key={p.id}
                          to={`/property/${p.id}`}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-surface-50 dark:bg-surface-900 p-1.5 hover:border-primary-400"
                        >
                          <img src={p.media?.find((mm) => mm.media_type === 'photo')?.url || ''} alt="" className="w-12 h-9 object-cover rounded bg-surface-200 dark:bg-surface-700" />
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-slate-800 dark:text-slate-100">{p.title}</span>
                            <span className="block text-xs text-primary-600 dark:text-primary-400">{formatPrice(p.price, p.price_type)}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && <div className="text-xs text-slate-400">Assistant is typing…</div>}
            <div ref={endRef} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="p-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <input
              className="input text-sm flex-1"
              placeholder="Ask about properties…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" disabled={busy || !input.trim()} className="btn-primary p-2 rounded-full disabled:opacity-50" aria-label="Send">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
