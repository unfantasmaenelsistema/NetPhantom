import React, { useState } from 'react';
import { Sparkles, Download, Check, RefreshCw, Image as ImageIcon, Sliders, Shield } from 'lucide-react';

interface ImageGeneratorViewProps {
  currentArtUrl?: string;
  codename: string;
  themeName: string;
  onSetArtUrl: (url: string) => void;
}

export const ImageGeneratorView: React.FC<ImageGeneratorViewProps> = ({
  currentArtUrl,
  codename,
  themeName,
  onSetArtUrl,
}) => {
  const [prompt, setPrompt] = useState<string>(
    `Cinematic cyber challenge cover art for "${themeName}". Futuristic dark computer terminal with hacking diagnostics and encrypted code streams, dark slate and muted amber lighting, high fidelity, 8k.`
  );
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '3:4'>('16:9');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string>(currentArtUrl || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activePresetPrompt, setActivePresetPrompt] = useState<string>('');

  const promptPresets = [
    {
      label: 'Cyber Terminal',
      prompt: `Dark moody cybersecurity workstation with glowing terminal logs, hacker silhouette, CRT screen reflections, muted cyan and amber lighting, high fidelity.`,
    },
    {
      label: 'Servidor Aislado',
      prompt: `Brushed steel modular server rack in an isolated air-gapped laboratory, cable routing, subtle status LEDs in dim atmosphere, photorealistic commercial grade.`,
    },
    {
      label: 'Emblema Insignia',
      prompt: `Minimalist cyber CTF tournament badge insignia, dark obsidian texture, glowing circuit traces, geometric shield emblem, 3D studio render.`,
    },
    {
      label: 'Póster de Serie',
      prompt: `Cinematic vintage TV mystery poster for "${themeName}", dramatic lighting, retro-futuristic hacker aesthetics, typography and graphic novel cover art style.`,
    },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);
    setSavedSuccess(false);

    try {
      const response = await fetch('/api/generate-machine-art', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          imageSize,
          aspectRatio,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Fallo en la generación de imagen');
      }

      setGeneratedUrl(data.imageUrl);
      onSetArtUrl(data.imageUrl);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      console.error('Image generation error:', err);
      setErrorMsg(err?.message || 'Error al conectar con el servicio de generación de imágenes.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedUrl) return;
    const a = document.createElement('a');
    a.href = generatedUrl;
    a.download = `cover_${codename.toLowerCase()}_${imageSize}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-semibold text-slate-100">
                Generador de Portadas y Pósters Oficiales con Gemini
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Diseña portadas de alta fidelidad para el reto utilizando el modelo{' '}
              <span className="font-mono text-cyan-300">gemini-3-pro-image-preview</span> con resolución adaptable (1K, 2K o 4K).
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Modelo: gemini-3-pro-image-preview</span>
          </div>
        </div>

        {/* Configuration Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
          {/* Prompt Column */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Descripción del arte temático (Prompt de generación)
              </label>
              <textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe la atmósfera, iluminación y elementos visuales característicos del reto..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* Prompt presets */}
            <div>
              <span className="text-[11px] font-medium text-slate-400 block mb-2">
                Estilos visuales predeterminados:
              </span>
              <div className="flex flex-wrap gap-2">
                {promptPresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setPrompt(preset.prompt);
                      setActivePresetPrompt(preset.label);
                    }}
                    className={`px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer ${
                      activePresetPrompt === preset.label
                        ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Size & Aspect Ratio Controls */}
          <div className="space-y-4 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
            {/* Image Size Affordance (1K, 2K, 4K) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300">
                  Resolución de imagen
                </label>
                <span className="text-[10px] font-mono text-cyan-400">gemini-3-pro-image</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['1K', '2K', '4K'] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setImageSize(size)}
                    className={`py-2 text-xs font-mono font-semibold rounded-lg border transition-all cursor-pointer ${
                      imageSize === size
                        ? 'border-cyan-500 bg-cyan-950/60 text-cyan-300 shadow-sm'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                {imageSize === '1K' && '1K: 1024px, rápido y nítido para avatares y tarjetas.'}
                {imageSize === '2K' && '2K: 2048px, alta definición para encabezados y portadas.'}
                {imageSize === '4K' && '4K: 4096px, máxima fidelidad y nivel de detalle para pósters.'}
              </p>
            </div>

            {/* Aspect Ratio Affordance */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Relación de aspecto
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '16:9', label: '16:9 Banner' },
                  { id: '1:1', label: '1:1 Cuadrado' },
                  { id: '3:4', label: '3:4 Póster' },
                ].map((ratio) => (
                  <button
                    key={ratio.id}
                    type="button"
                    onClick={() => setAspectRatio(ratio.id as any)}
                    className={`py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
                      aspectRatio === ratio.id
                        ? 'border-cyan-500 bg-cyan-950/60 text-cyan-300 font-medium'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Trigger Button */}
            <button
              type="button"
              disabled={isLoading || !prompt.trim()}
              onClick={handleGenerate}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-lg transition-colors cursor-pointer mt-4"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Renderizando con Gemini ({imageSize})...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-current" />
                  <span>Generar Póster ({imageSize})</span>
                </>
              )}
            </button>

            {errorMsg && (
              <div className="text-[11px] text-rose-400 p-2 rounded bg-rose-950/30 border border-rose-900/50">
                {errorMsg}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-slate-400" />
            <h4 className="text-sm font-semibold text-slate-200">Vista Previa de la Portada Oficial</h4>
          </div>

          {generatedUrl && (
            <div className="flex items-center gap-3">
              {savedSuccess && (
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                  <Check className="w-3.5 h-3.5" /> Portada asignada al reto
                </span>
              )}
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-700/60 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar portada ({imageSize})</span>
              </button>
            </div>
          )}
        </div>

        <div className="pt-5 flex items-center justify-center">
          {generatedUrl ? (
            <div className="relative max-w-3xl w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
              <img
                src={generatedUrl}
                alt={`Portada oficial para ${themeName}`}
                referrerPolicy="no-referrer"
                className="w-full h-auto object-cover max-h-[500px]"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono text-cyan-300 font-bold uppercase">{codename}</div>
                  <div className="text-sm font-semibold text-white">{themeName}</div>
                </div>
                <div className="text-xs font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                  {imageSize} · {aspectRatio}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 w-full max-w-3xl border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center p-6 text-center bg-slate-950/40">
              <Shield className="w-12 h-12 text-slate-700 mb-3" />
              <div className="text-sm font-medium text-slate-300">Aún no se ha generado una portada</div>
              <div className="text-xs text-slate-500 max-w-sm mt-1">
                Utiliza el formulario superior para crear arte temático oficial de alta definición en 1K, 2K o 4K para este reto.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
