import React, { useState } from 'react';
import { Copy, Check, Download, Terminal, Box, Layers } from 'lucide-react';

interface CodeViewerProps {
  provisionScript: string;
  dockerfile: string;
  dockerCompose: string;
  codename: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  provisionScript,
  dockerfile,
  dockerCompose,
  codename,
}) => {
  const [activeTab, setActiveTab] = useState<'bash' | 'dockerfile' | 'compose'>('bash');
  const [copied, setCopied] = useState(false);

  const getActiveContent = () => {
    switch (activeTab) {
      case 'bash':
        return {
          content: provisionScript,
          filename: 'provision.sh',
          language: 'bash',
        };
      case 'dockerfile':
        return {
          content: dockerfile,
          filename: 'Dockerfile',
          language: 'dockerfile',
        };
      case 'compose':
        return {
          content: dockerCompose,
          filename: 'docker-compose.yml',
          language: 'yaml',
        };
    }
  };

  const { content, filename } = getActiveContent();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border border-slate-800 bg-slate-900/60 rounded-xl overflow-hidden flex flex-col">
      {/* Code Header with Tabs and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800/80">
          <button
            type="button"
            onClick={() => setActiveTab('bash')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'bash'
                ? 'bg-slate-800 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>provision.sh</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dockerfile')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'dockerfile'
                ? 'bg-slate-800 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Dockerfile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('compose')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'compose'
                ? 'bg-slate-800 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>docker-compose.yml</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-700/60 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-700/60 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar</span>
          </button>
        </div>
      </div>

      {/* Code Body */}
      <div className="relative p-4 overflow-x-auto bg-slate-950 font-mono text-xs leading-relaxed text-slate-300 max-h-[620px] select-text">
        <pre className="whitespace-pre">{content}</pre>
      </div>

      {/* Code Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400 font-mono">
        <span>Archivo: {filename}</span>
        <span>Máquina: {codename}</span>
      </div>
    </div>
  );
};
