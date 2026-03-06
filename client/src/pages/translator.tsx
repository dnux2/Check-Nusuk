import { useState } from "react";
import { useTranslate } from "@/hooks/use-ai";
import { Languages, ArrowRightLeft } from "lucide-react";
import { motion } from "framer-motion";

const LANGUAGES = ["Arabic", "English", "Urdu", "French", "Malay", "Indonesian"];

export function TranslatorPage() {
  const [text, setText] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("Arabic");
  const translate = useTranslate();

  const handleTranslate = () => {
    if (!text) return;
    translate.mutate({ text, targetLanguage });
  };

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto h-[calc(100vh-5rem)] flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
          <Languages className="w-8 h-8 text-primary" />
          AI Field Translator
        </h1>
        <p className="text-muted-foreground mt-1 text-lg">Instant communication bridging for supervisors.</p>
      </div>

      <div className="grid md:grid-cols-[1fr,auto,1fr] gap-6 items-center flex-1 min-h-0">
        <div className="flex flex-col h-full bg-card rounded-2xl border border-border shadow-sm p-4">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-muted-foreground">Auto-Detect</span>
          </div>
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or speak what you want to translate..."
            className="flex-1 w-full bg-transparent resize-none outline-none text-xl lg:text-2xl placeholder:text-muted p-2"
          />
        </div>

        <button 
          onClick={handleTranslate}
          disabled={!text || translate.isPending}
          className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/25 hover:scale-110 disabled:opacity-50 disabled:hover:scale-100 transition-all mx-auto"
        >
          <ArrowRightLeft className={`w-6 h-6 ${translate.isPending ? 'animate-spin' : ''}`} />
        </button>

        <div className="flex flex-col h-full bg-secondary/30 rounded-2xl border border-border shadow-sm p-4 relative overflow-hidden">
          <div className="flex justify-between items-center mb-4 z-10">
            <select 
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="bg-background border border-border rounded-lg px-3 py-1 font-bold text-primary outline-none focus:ring-2 focus:ring-primary/20"
            >
              {LANGUAGES.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div className="flex-1 text-xl lg:text-2xl font-medium p-2 z-10">
            {translate.isPending ? (
              <span className="text-muted-foreground animate-pulse">Translating...</span>
            ) : translate.data ? (
              translate.data.translatedText
            ) : (
              <span className="text-muted-foreground/50">Translation will appear here</span>
            )}
          </div>
          
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
