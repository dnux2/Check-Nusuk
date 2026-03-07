import { useState, useEffect, useRef } from "react";
import { usePilgrims } from "@/hooks/use-pilgrims";
import { useLanguage } from "@/contexts/language-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type ChatMessage, type Pilgrim } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Users, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { useSearch } from "wouter";

export function ChatPage() {
  const { t, isRTL } = useLanguage();
  const { data: pilgrims } = usePilgrims();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const urlPilgrimId = params.get("pilgrimId") ? Number(params.get("pilgrimId")) : null;
  const [selectedPilgrimId, setSelectedPilgrimId] = useState<number | null>(urlPilgrimId);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages"],
    refetchInterval: 3000,
  });

  const sendMessage = useMutation({
    mutationFn: (msg: { message: string; pilgrimId: number | null; senderRole: string }) =>
      apiRequest("POST", "/api/chat/messages", msg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
      setInput("");
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    sendMessage.mutate({
      message: trimmed,
      pilgrimId: selectedPilgrimId,
      senderRole: "supervisor",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const displayMessages = selectedPilgrimId === null
    ? messages.filter(m => m.pilgrimId === null)
    : messages.filter(m => m.pilgrimId === null || m.pilgrimId === selectedPilgrimId);

  const getPilgrimName = (id: number | null) => {
    if (!id) return t("allPilgrimsLabel");
    return pilgrims?.find(p => p.id === id)?.name ?? `#${id}`;
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
      {/* Sidebar — pilgrim list */}
      <div className="w-72 flex-shrink-0 border-e border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className={`font-display font-bold text-lg ${isRTL ? "text-right" : ""}`}>
            {t("supervisorChat")}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t("supervisorChatDesc")}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* Broadcast row */}
          <button
            data-testid="chat-thread-broadcast"
            onClick={() => setSelectedPilgrimId(null)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-start ${isRTL ? "flex-row-reverse text-right" : ""}
              ${selectedPilgrimId === null ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-secondary text-foreground"}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedPilgrimId === null ? "bg-white/20" : "bg-primary/10"}`}>
              <Users className={`w-4 h-4 ${selectedPilgrimId === null ? "text-white" : "text-primary"}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`font-semibold text-sm truncate ${selectedPilgrimId === null ? "text-primary-foreground" : ""}`}>{t("broadcastAnnouncement")}</p>
              <p className={`text-xs truncate ${selectedPilgrimId === null ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{t("allPilgrimsLabel")}</p>
            </div>
          </button>

          {/* Individual pilgrim rows */}
          {pilgrims?.map((p: Pilgrim) => {
            const isActive = selectedPilgrimId === p.id;
            const unread = messages.filter(m => m.pilgrimId === p.id && m.senderRole === "pilgrim").length;
            return (
              <button
                key={p.id}
                data-testid={`chat-thread-pilgrim-${p.id}`}
                onClick={() => setSelectedPilgrimId(p.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-start ${isRTL ? "flex-row-reverse text-right" : ""}
                  ${isActive ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-secondary text-foreground"}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>
                  {p.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`font-semibold text-sm truncate ${isActive ? "text-primary-foreground" : ""}`}>{p.name}</p>
                  <p className={`text-xs truncate ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{p.nationality}</p>
                </div>
                {unread > 0 && !isActive && (
                  <span className="w-5 h-5 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className={`h-16 flex-shrink-0 border-b border-border bg-card px-6 flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            {selectedPilgrimId === null
              ? <Users className="w-4 h-4 text-primary" />
              : <MessageSquare className="w-4 h-4 text-primary" />
            }
          </div>
          <div className={isRTL ? "text-right" : ""}>
            <p className="font-bold text-sm">{getPilgrimName(selectedPilgrimId)}</p>
            <p className="text-xs text-muted-foreground">
              {selectedPilgrimId === null ? t("allPilgrimsLabel") : `${t("sendingTo")} ${getPilgrimName(selectedPilgrimId)}`}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-background/50">
          {displayMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
              <MessageSquare className="w-12 h-12 opacity-20" />
              <p className="font-medium">{t("noMessages")}</p>
            </div>
          )}

          <AnimatePresence initial={false}>
            {displayMessages.map((msg) => {
              const isSupervisor = msg.senderRole === "supervisor";
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${isSupervisor ? (isRTL ? "flex-row" : "flex-row-reverse") : (isRTL ? "flex-row-reverse" : "flex-row")}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${isSupervisor ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                    {isSupervisor ? "AS" : (msg.pilgrimId ? getPilgrimName(msg.pilgrimId).slice(0, 2).toUpperCase() : "H")}
                  </div>
                  <div className={`max-w-[70%] flex flex-col gap-1 ${isSupervisor ? (isRTL ? "items-start" : "items-end") : (isRTL ? "items-end" : "items-start")}`}>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      {isSupervisor ? t("supervisorLabel") : (msg.pilgrimId ? getPilgrimName(msg.pilgrimId) : t("pilgrimLabel"))}
                      {msg.pilgrimId === null && !isSupervisor ? "" : ""}
                    </p>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed ${
                      isSupervisor
                        ? "bg-primary text-primary-foreground rounded-ee-sm"
                        : "bg-card border border-border text-foreground rounded-es-sm"
                    }`}>
                      {msg.message}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {msg.timestamp ? format(new Date(msg.timestamp), "HH:mm") : ""}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className={`p-4 border-t border-border bg-card flex items-end gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className="flex-1 relative">
            <textarea
              data-testid="input-chat-message"
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedPilgrimId === null ? `${t("broadcastAnnouncement")}...` : t("typeMessage")}
              dir={isRTL ? "rtl" : "ltr"}
              className={`w-full resize-none rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all max-h-32 overflow-auto ${isRTL ? "text-right" : ""}`}
              style={{ minHeight: 48 }}
            />
          </div>
          <button
            data-testid="button-send-chat"
            onClick={handleSend}
            disabled={!input.trim() || sendMessage.isPending}
            className={`h-12 px-5 bg-primary text-primary-foreground rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 hover:bg-primary/90 transition-colors flex-shrink-0 ${isRTL ? "flex-row-reverse" : ""}`}
          >
            <Send className="w-4 h-4" />
            {t("send")}
          </button>
        </div>
      </div>
    </div>
  );
}
