import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, MessageCircle, Send, X } from "lucide-react";

type ChatRole = "bot" | "user";

type ChatMessage = {
  id: number;
  role: ChatRole;
  text: string;
};

const starterMessage: ChatMessage = {
  id: 1,
  role: "bot",
  text: "Hi, I am the Talentek assistant. Ask me about hiring campaigns, talent applications, interviews, subscriptions, or support.",
};

const quickPrompts = [
  "How do I post a hiring campaign?",
  "Where can I track interviews?",
  "How do I update my profile?",
  "How can I contact support?",
];

const responseRules: Array<{ keywords: string[]; response: string }> = [
  {
    keywords: ["hire", "campaign", "job", "post"],
    response:
      "To hire with Talentek, go to Employer Space, open Jobs, and click 'Post a hiring campaign'. Add your role details and the platform will help you screen candidates quickly.",
  },
  {
    keywords: ["interview", "schedule", "technical", "leadership"],
    response:
      "Interview flow is managed from your dashboard. You can monitor technical and leadership evaluations, check pending reviews, and follow each candidate stage in one place.",
  },
  {
    keywords: ["application", "offer", "talent"],
    response:
      "Talents can review Applications and Offers from the Talent dashboard. Employers can track progress from Pipeline and Interviews sections.",
  },
  {
    keywords: ["profile", "account", "settings"],
    response:
      "You can update your information from the Profile or Settings page in your portal sidebar. Changes are applied immediately for your account.",
  },
  {
    keywords: ["payment", "billing", "subscription", "invoice"],
    response:
      "Billing is available in Employer Admin under Subscription and Billing. You can review current plan details and payment status there.",
  },
  {
    keywords: ["support", "ticket", "help"],
    response:
      "For support, use the Support Tickets section in your portal. Include clear issue details and our team will respond as fast as possible.",
  },
];

const fallbackReply =
  "Thanks for your message. I can help with hiring campaigns, interviews, applications, profiles, subscriptions, and support tickets. Tell me what you want to do.";

const getBotReply = (question: string): string => {
  const normalized = question.toLowerCase();
  const matchedRule = responseRules.find((rule) =>
    rule.keywords.some((keyword) => normalized.includes(keyword)),
  );

  return matchedRule ? matchedRule.response : fallbackReply;
};

const GlobalChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([starterMessage]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const replyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, isThinking]);

  useEffect(() => {
    return () => {
      if (replyTimerRef.current !== null) {
        window.clearTimeout(replyTimerRef.current);
      }
    };
  }, []);

  const sendMessage = (messageText: string) => {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage || isThinking) {
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      text: trimmedMessage,
    };

    setMessages((previous) => [...previous, userMessage]);
    setDraft("");
    setIsThinking(true);

    replyTimerRef.current = window.setTimeout(() => {
      const botMessage: ChatMessage = {
        id: Date.now() + 1,
        role: "bot",
        text: getBotReply(trimmedMessage),
      };
      setMessages((previous) => [...previous, botMessage]);
      setIsThinking(false);
    }, 550);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage(draft);
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[70] flex flex-col items-end">
      {isOpen && (
        <section className="w-[calc(100vw-2rem)] sm:w-[390px] h-[min(68vh,560px)] rounded-2xl border border-orange-200 bg-white shadow-2xl overflow-hidden mb-3 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <header className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-none">Talentek Assistant</p>
                <p className="text-xs text-orange-100">Online now</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 hover:bg-white/20 transition-colors"
              aria-label="Close chatbot"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          <div className="h-[calc(100%-128px)] overflow-y-auto px-3 py-3 bg-gradient-to-b from-orange-50 via-white to-orange-50">
            <div className="flex flex-wrap gap-2 mb-3">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="text-xs px-2.5 py-1.5 rounded-full border border-orange-200 bg-white text-orange-700 hover:bg-orange-100 transition-colors"
                  onClick={() => sendMessage(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-br-sm"
                        : "bg-white border border-orange-100 text-slate-700 rounded-bl-sm"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex justify-start">
                  <div className="bg-white border border-orange-100 text-slate-600 rounded-2xl rounded-bl-sm px-3 py-2 text-sm shadow-sm">
                    Typing...
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="h-16 border-t border-orange-100 bg-white px-3 flex items-center gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask anything about Talentek..."
              className="flex-1 h-10 rounded-xl border border-orange-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
            />
            <button
              type="submit"
              disabled={!draft.trim() || isThinking}
              className="h-10 w-10 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:from-orange-700 hover:to-orange-600 transition-colors"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className="h-14 w-14 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white border-0 ring-0 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-lg shadow-orange-700/35 flex items-center justify-center hover:from-orange-700 hover:to-orange-600 transition-all duration-200"
        aria-label={isOpen ? "Close chatbot" : "Open chatbot"}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
};

export default GlobalChatbot;
