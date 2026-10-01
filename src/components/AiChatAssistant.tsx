import React, { useState } from 'react';
import { X, Send, Bot, Sparkles } from 'lucide-react';
import { askAiBrain } from '../services/api';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

export const AiChatAssistant: React.FC<{ currentLang?: string }> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'ai',
      text: '🤖 Namaste! Main RAAH NAGAR AI Smart Assistant hoon. Aap RAAH NAGAR AI ke 18 features me se kisi ke baare me bhi (Water Leakage, Fire Route, P-Coins Parking, Lift Emergency, Noise Guardian, NLP Tickets) mujhse Hindi, Hinglish ya English me detail me pooch sakte hain!',
      time: 'Just now'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const generateAnswer = (query: string): string => {
    const q = query.toLowerCase();

    if (q.includes('water') || q.includes('paani') || q.includes('leakage') || q.includes('valve') || q.includes('v-102')) {
      return `💧 **Water Monitoring & Leakage System (Features 04 & 05):**
1. **IoT Sensor Monitoring**: Main Overhead Tank (74%), Underground Reservoir (92%), aur Recycled Water Line continuous pressure check karte hain.
2. **Auto Leakage Shut-off (Valve V-102)**: Jab pipeline me 90%+ anomaly ya pressure drop milta hai, AI automatic Main Valve V-102 ko close kar deta hai.
3. **Verification Override**: Facility Admin dashboard par "Confirm Leakage Verification" button se system reset kar sakte hain.`;
    }

    if (q.includes('fire') || q.includes('aag') || q.includes('emergency') || q.includes('evacuation')) {
      return `🔥 **Fire Emergency & Evacuation System (Feature 07):**
1. **Smoke & Heat Sensors**: Tower A/B/C ke floor-by-floor sensors 96% smoke level tak smoke detect karke instantly fire alarm play karte hain.
2. **Dynamic Safe Evacuation Route**: Floor map par green LED arrows active hote hain jo safe stairwell ki taraf routing karte hain.
3. **Emergency Sirens**: System alert drawer aur notifications par siren chime chime play karta hai.`;
    }

    if (q.includes('parking') || q.includes('p-coin') || q.includes('pcoin') || q.includes('guest') || q.includes('slot')) {
      return `🅿️ **Smart Dynamic Parking & P-Coins Engine (Features 03 & 15):**
1. **Color Coding Grid**:
   - 🟢 **Vacant (Green)**: Khali space available for instant parking.
   - 🩵 **Light Blue (Shared)**: Resident owner absent -> Listed for guest sharing.
   - 🔷 **Blue (Guest)**: Guest pass active reserved space.
   - 🩶 **Grey (Occupied)**: Resident car parked.
2. **P-Coins Token Reward**: Apna khali space 9am-5pm share karne par aapko +50 P-Coins monthly maintenance bill discount me milte hain.`;
    }

    if (q.includes('lift') || q.includes('elevator') || q.includes('trapped')) {
      return `🛗 **Lift Emergency Tracker & Cabin Voice (Feature 08):**
1. **Trapped Anomaly Code E-301**: Fault Code generate hone par lift cabin auto-lock open mode activate karti hai.
2. **2-Way Reassurance Voice**: Cabin speaker se resident ko reassure karne ke liye AI voice statement play hoti hai.
3. **Tech Dispatch**: Nearest maintenance technician ETA 3m timer countdown ke saath trigger hota hai.`;
    }

    if (q.includes('noise') || q.includes('sound') || q.includes('decibel') || q.includes('privacy')) {
      return `🔊 **Privacy-First Noise Guardian (Feature 12):**
1. **Privacy First**: Raw audio mic sound recorded NAHI hota, sirf decibel levels (dB) measure hote hain.
2. **3-Stage Violation Escalation**:
   - **Stage 1**: Polite mobile notification warning.
   - **Stage 2**: Community noise fine badge applied.
   - **Stage 3**: Facility admin escalation & security gate intervention.`;
    }

    if (q.includes('ticket') || q.includes('maintenance') || q.includes('nlp') || q.includes('shikayat')) {
      return `🔧 **NLP Smart Maintenance Classifier (Feature 11):**
1. **Natural Language Processing**: Aap Hindi ya English me shikayat type karein (jaise "Pani tapak raha hai"), AI automatic complaint type 'Plumbing' filter karke technician assign kar deta hai.`;
    }

    return `🤖 **RAAH NAGAR AI Smart System Summary:**
RAAH NAGAR AI me 18 features integrated hain:
- **01-Home Dashboard**, **02-AI Brain Engine**, **03-Dynamic Parking (P-Coins)**
- **04-Water Tank Gauges**, **05-Valve V-102 Shut-off**, **06-Motion Streetlight**
- **07-Fire Safe Route**, **08-Lift SOS Voice**, **09-Silent Visitor Pass**
- **10-Waste Auto Dispatch**, **11-NLP Tickets**, **12-Noise Guardian**
- **13-Tool Sharing**, **14-Escrow Trust**, **15-Guest Parking**, **16-Audit Logs**, **17-Privacy Center**, **18-3-Layer Alerts**.

Aap inme se kisi specific feature ke baare me detail puch sakte hain!`;
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    // Call live backend AI first, fallback to rule engine if backend offline
    askAiBrain(currentInput)
      .then((res) => {
        const text = res && res.success && res.answer ? res.answer : generateAnswer(currentInput);
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsTyping(false);
      })
      .catch(() => {
        const aiReplyText = generateAnswer(currentInput);
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: aiReplyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsTyping(false);
      });
  };

  const quickQuestions = [
    'Water Leakage Valve kaise band hota hai?',
    'Fire Emergency Evacuation route kaise kaam karta hai?',
    'Dynamic Parking me P-Coins kaise milte hain?',
    'Lift trapped emergency me AI kya bolta hai?'
  ];

  return (
    <>
      {/* Floating AI Button (Bottom Right) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold rounded-full shadow-2xl hover:scale-105 transition-all cursor-pointer border border-cyan-400/40 active:scale-95"
          title="Chat with RAAH NAGAR AI Assistant"
        >
          <div className="relative">
            <Bot className="w-6 h-6 shrink-0" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <span className="text-sm tracking-wide hidden sm:inline">AI Brain Chat</span>
          <Sparkles className="w-4 h-4 text-cyan-200 shrink-0" />
        </button>
      )}

      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[420px] h-[520px] bg-[#0b0f19] border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn backdrop-blur-xl">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  RAAH NAGAR AI Assistant
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">ONLINE</span>
                </h3>
                <p className="text-[10px] text-slate-400">Ask anything in Hindi, Hinglish or English</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Questions Pills */}
          <div className="p-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[10px]">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => { setInput(q); }}
                className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/20 whitespace-nowrap shrink-0 cursor-pointer transition-all"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed whitespace-pre-line shadow-md ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-slate-500 mt-1 px-1">{m.time}</span>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 p-2.5 rounded-xl w-fit">
                <Bot className="w-4 h-4 text-cyan-400 animate-spin" />
                <span>AI is analyzing society telemetry...</span>
              </div>
            )}
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about water, fire, parking, noise..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white disabled:opacity-40 hover:brightness-110 cursor-pointer transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
