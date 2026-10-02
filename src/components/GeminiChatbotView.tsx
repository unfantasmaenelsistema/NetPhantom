import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, RefreshCw, Sparkles, Copy, Check, Shield, Cpu, HelpCircle, Terminal } from 'lucide-react';
import { ChatMessage, ChatRole, GeminiChatModel } from '../types';

interface GeminiChatbotViewProps {
  currentScenarioSummary: string;
}

export const GeminiChatbotView: React.FC<GeminiChatbotViewProps> = ({ currentScenarioSummary }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'init-msg',
        role: 'model',
        content: `¡Hola! Soy tu asistente de ingeniería y mentoría para retos CTF. 
Puedo ayudarte a diseñar vulnerabilidades realistas, perfeccionar scripts de aprovisionamiento en bash, estructurar redes en Docker o crear pistas progresivas para tus alumnos.

Actualmente estamos trabajando sobre el escenario:
${currentScenarioSummary}

¿En qué área del reto te gustaría trabajar?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'gemini-3.5-flash',
      },
    ];
  });

  const [input, setInput] = useState('');
  const [role, setRole] = useState<ChatRole>('mentor');
  const [model, setModel] = useState<GeminiChatModel>('gemini-3.5-flash');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const rolesList: Array<{ id: ChatRole; label: string; desc: string; icon: any }> = [
    {
      id: 'mentor',
      label: 'Arquitecto CTF',
      desc: 'Diseño de narrativa, mecánicas y equilibrio de dificultad',
      icon: Sparkles,
    },
    {
      id: 'provisioner',
      label: 'DevSecOps & Bash',
      desc: 'Scripts de aprovisionamiento, Dockerfiles y aislamiento de red',
      icon: Terminal,
    },
    {
      id: 'auditor',
      label: 'Auditor de Seguridad',
      desc: 'Verificación de cadenas de ataque y mitigaciones defensivas',
      icon: Shield,
    },
    {
      id: 'hint_crafter',
      label: 'Diseñador de Pistas',
      desc: 'Creación de pistas graduales en 3 niveles sin revelar la solución',
      icon: HelpCircle,
    },
  ];

  const quickPrompts = [
    '¿Cómo encadeno la vulnerabilidad inicial con una escalada de privilegios creíble?',
    'Genera 3 pistas progresivas para este reto sin revelar las banderas.',
    '¿Qué comandos bash faltan para endurecer el contenedor y aislar la red?',
    'Explícame cómo un analista defensivo (Blue Team) detectaría este ataque en logs.',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || input).trim();
    if (!messageText || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          role,
          model,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al comunicarse con Gemini');
      }

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `⚠️ Error: ${err?.message || 'No se pudo obtener respuesta del modelo.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = async (msgId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  return (
    <div className="border border-slate-800 bg-slate-900/60 rounded-xl overflow-hidden flex flex-col h-[760px]">
      {/* Chat Configuration Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Role Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-900 rounded-lg border border-slate-800/80">
          {rolesList.map((r) => {
            const Icon = r.icon;
            const isSelected = role === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={r.desc}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* Model Switcher per instructions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Modelo Gemini:</span>
          </div>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value as GeminiChatModel)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complejo / STEM)</option>
            <option value="gemini-3.5-flash">gemini-3.5-flash (General / Equilibrado)</option>
            <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Rápido / Respuestas breves)</option>
          </select>
        </div>
      </div>

      {/* Messages Thread (Scrollable) */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-950/40">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-4xl ${isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800/60 flex items-center justify-center shrink-0 text-cyan-400">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`group relative rounded-xl p-4 text-xs leading-relaxed max-w-2xl border ${
                  isUser
                    ? 'bg-slate-800 border-slate-700 text-slate-100 shadow-md'
                    : 'bg-slate-900/90 border-slate-800 text-slate-200 shadow-sm'
                }`}
              >
                {/* Header metadata */}
                <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-slate-800/60 text-[10px] text-slate-400 font-mono">
                  <span>{isUser ? 'Tú (Docente / Organizador)' : `Mentor IA`}</span>
                  <div className="flex items-center gap-2">
                    {msg.modelUsed && <span>{msg.modelUsed}</span>}
                    <span>{msg.timestamp}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className="opacity-0 group-hover:opacity-100 hover:text-slate-200 transition-opacity ml-1"
                      title="Copiar texto"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Message Body */}
                <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 max-w-2xl mr-auto">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800/60 flex items-center justify-center shrink-0 text-cyan-400">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="rounded-xl p-4 bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span>Razonando respuesta con {model}...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 bg-slate-950 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto">
        <span className="text-[11px] text-slate-400 whitespace-nowrap">Sugerencias:</span>
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(q)}
            className="text-[11px] text-slate-400 hover:text-cyan-300 bg-slate-900/80 hover:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-800 whitespace-nowrap transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Pregunta a ${rolesList.find((r) => r.id === role)?.label}...`}
          disabled={isLoading}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-4 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 transition-colors cursor-pointer"
        >
          <span>Enviar</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
