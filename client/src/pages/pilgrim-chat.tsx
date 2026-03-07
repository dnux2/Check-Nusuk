import { useState, useRef, useEffect } from "react";
import { Send, MessageSquare, Shield, Wifi, WifiOff } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type ChatMessage } from "@shared/schema";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { PilgrimLayout } from "@/components/pilgrim-layout";
import { useChatWebSocket } from "@/hooks/use-chat-ws";

export function PilgrimChatPage() {
  const { lang, isRTL } = useLanguage();
  const ar = lang === "ar";
  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [wsConnected, setWsConnected] = useState(false);

  const pilgrimId = Number(localStorage.getItem("pilgrimId") || "1");

  const wsStatusRef = useChatWebSocket((msg) => {
    setWsConnected(wsStatusRef.current === "open");
    if (msg.pilgrimId === pilgrimId || msg.pilgrimId === null) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setWsConnected(wsStatusRef.current === "open");
    }, 1000);
    return () => clearInterval(interval);
  }, [wsStatusRef]);

  const { data: chatMessages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages"],
    refetchInterval: wsConnected ? false : 3000,
  });

  const myMessages = chatMessages.filter(
    m => m.pilgrimId === pilgrimId || m.pilgrimId === null
  );

  const sendChatMsg = useMutation({
    mutationFn: (msg: { message: string; pilgrimId: number; senderRole: string }) =>
      apiRequest("POST", "/api/chat/messages", msg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
      setChatInput("");
    },
  });

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [myMessages.length]);

  const handleSend = () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    sendChatMsg.mutate({ message: trimmed, pilgrimId, senderRole: "pilgrim" });
  };

  return (
    <PilgrimLayout>
      <div
        className="flex flex-col overflow-hidden"
        style={{ height: "calc(100svh - 56px)", direction: isRTL ? "rtl" : "ltr" }}
      >

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border bg-card flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-[#0E4D41] flex items-center justify-center flex-shrink-0 shadow-sm">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[#0E4D41] text-[15px] leading-tight truncate">
              {ar ? "المشرف — حملة التوحيد" : "Supervisor — Al-Tawheed Group"}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {wsConnected
                ? <><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /><span className="text-xs text-emerald-600 font-semibold">{ar ? "متصل — رسائل فورية" : "Connected — live"}</span></>
                : <><div className="w-2 h-2 bg-amber-400 rounded-full" /><span className="text-xs text-amber-600 font-semibold">{ar ? "يتصل..." : "Reconnecting..."}</span></>
              }
            </div>
          </div>
          <div
            data-testid="pilgrim-ws-status"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border flex-shrink-0 ${
              wsConnected
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-600 border-amber-200"
            }`}
          >
            {wsConnected
              ? <><Wifi className="w-3 h-3" />{ar ? "مباشر" : "Live"}</>
              : <><WifiOff className="w-3 h-3" />{ar ? "..." : "..."}</>
            }
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-background">
          {myMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
              <MessageSquare className="w-10 h-10 opacity-20" />
              <p className="text-sm font-medium">{ar ? "لا توجد رسائل بعد" : "No messages yet"}</p>
              <p className="text-xs opacity-70">{ar ? "ابدأ محادثة مع مشرفك" : "Start a conversation with your supervisor"}</p>
            </div>
          )}
          {myMessages.map((msg, i) => {
            const isPilgrim = msg.senderRole === "pilgrim";
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.2) }}
                className={`flex ${isPilgrim
                  ? (isRTL ? "justify-start" : "justify-end")
                  : (isRTL ? "justify-end" : "justify-start")}`}
              >
                {!isPilgrim && (
                  <div className="w-7 h-7 rounded-full bg-[#0E4D41] flex items-center justify-center flex-shrink-0 mt-1 mx-2 shadow-sm">
                    <Shield className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div className={`max-w-[72%] flex flex-col ${isPilgrim ? (isRTL ? "items-start" : "items-end") : (isRTL ? "items-end" : "items-start")}`}>
                  <p className="text-[10px] text-muted-foreground font-medium mb-0.5 px-1">
                    {isPilgrim ? (ar ? "أنت" : "You") : (ar ? "المشرف" : "Supervisor")}
                  </p>
                  <div
                    dir="auto"
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm
                      ${isPilgrim
                        ? "bg-[#0E4D41] text-white rounded-br-sm"
                        : msg.pilgrimId === null
                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 rounded-bl-sm border border-amber-200 dark:border-amber-700"
                        : "bg-card text-foreground border border-border rounded-bl-sm"
                      }`}
                  >
                    {msg.pilgrimId === null && (
                      <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 mb-1 uppercase tracking-wide">
                        {ar ? "📢 رسالة للجميع" : "📢 Broadcast"}
                      </div>
                    )}
                    {msg.message}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 px-1">
                    {msg.timestamp ? format(new Date(msg.timestamp), "HH:mm") : ""}
                    {isPilgrim && <span className="mx-1 text-emerald-500">✓✓</span>}
                  </p>
                </div>
              </motion.div>
            );
          })}
          <div ref={chatBottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 bg-card border-t border-border flex-shrink-0">
          <div className={`flex gap-2 items-end ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className="flex-1 bg-background border border-border rounded-2xl px-4 py-2.5 shadow-sm focus-within:border-[#0E4D41] transition-colors">
              <textarea
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={ar ? "اكتب رسالتك للمشرف..." : "Type a message to your supervisor..."}
                className="w-full text-sm bg-transparent resize-none outline-none text-foreground placeholder:text-muted-foreground max-h-20"
                rows={1}
                dir="auto"
                data-testid="input-chat-message"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!chatInput.trim() || sendChatMsg.isPending}
              className="w-10 h-10 rounded-2xl bg-[#0E4D41] hover:bg-[#0E4D41]/90 disabled:opacity-40 flex items-center justify-center transition-colors flex-shrink-0 shadow-md"
              data-testid="btn-send-chat"
            >
              {sendChatMsg.isPending
                ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <Send className={`w-4 h-4 text-white ${isRTL ? "scale-x-[-1]" : ""}`} />
              }
            </button>
          </div>
        </div>

      </div>
    </PilgrimLayout>
  );
}
