import React, { useState, useEffect, useRef } from 'react';
import {
  Award,
  Download,
  Printer,
  Copy,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  Hash,
  ExternalLink,
  User,
  Calendar,
} from 'lucide-react';
import { CTFScenario } from '../types';
import {
  CertificateData,
  computeCertificateHash,
  generateCertificateHtml,
  printCertificateAsPdf,
  downloadCertificateHtml,
} from '../utils/generateCertificateHtml';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: CTFScenario;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  scenario,
}) => {
  const [studentName, setStudentName] = useState(() => {
    return localStorage.getItem('netphantom_student_name') || 'Auditor de Ciberseguridad';
  });
  const [sha256Hash, setSha256Hash] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [copiedHash, setCopiedHash] = useState(false);
  const [dateStr, setDateStr] = useState('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize certificate data
  useEffect(() => {
    if (!isOpen) return;

    const now = new Date();
    const formattedDate = now.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    setDateStr(formattedDate);

    const generatedSerial = `NP-${scenario.codename.replace(/[^A-Z0-9]/g, '').slice(0, 6)}-${Math.floor(
      100000 + Math.random() * 900000
    )}`;
    setSerialNumber(generatedSerial);

    computeCertificateHash(studentName, scenario, now.toISOString()).then(setSha256Hash);
  }, [isOpen, scenario]);

  // Recompute hash when studentName changes
  useEffect(() => {
    if (!isOpen || !studentName) return;
    localStorage.setItem('netphantom_student_name', studentName);
    computeCertificateHash(studentName, scenario, dateStr).then(setSha256Hash);
  }, [studentName, isOpen, scenario, dateStr]);

  // Confetti canvas animation
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const colors = ['#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#38bdf8', '#a855f7'];
    const particles = Array.from({ length: 80 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * -height,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: Math.random() * 3 + 2,
      speedX: (Math.random() - 0.5) * 2,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 6,
    }));

    let startTime = Date.now();

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();

        if (p.y > height) {
          p.y = -10;
          p.x = Math.random() * width;
        }
      });

      // Stop confetti after 5 seconds to free CPU
      if (Date.now() - startTime < 5000) {
        animationId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const certificateData: CertificateData = {
    studentName: studentName.trim() || 'Auditor Anónimo',
    scenario,
    dateStr,
    serialNumber,
    sha256Hash: sha256Hash || 'GENERATING_HASH...',
  };

  const handleCopyHash = () => {
    if (!sha256Hash) return;
    navigator.clipboard.writeText(sha256Hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Confetti Background Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-10 w-full h-full"
      />

      <div className="relative z-20 w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-950/80 border border-amber-700/60 text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>¡Felicitaciones! Reto CTF Superado</span>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-950/90 text-emerald-300 border border-emerald-800/80 font-semibold">
                  100% FLAGS CAPTURADAS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Has validado tanto <code className="text-cyan-400 font-mono">user.txt</code> como <code className="text-rose-400 font-mono">root.txt</code> en {scenario.themeName}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Student Name Input & Info */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              Personaliza el Nombre o Alias en tu Certificado Oficial:
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <User className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Tu nombre completo o handle de hacker (ej: Elliot Alderson)"
                  maxLength={50}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 font-medium placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => printCertificateAsPdf(certificateData)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-400 text-slate-950 hover:bg-cyan-300 transition-all shadow-md shadow-cyan-950/50 cursor-pointer shrink-0"
                  title="Abrir diálogo de impresión ajustado en Horizontal A4 para 1 sola hoja"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Guardar PDF (1 Hoja)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const html = generateCertificateHtml(certificateData);
                    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank');
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer shrink-0"
                  title="Abrir en pantalla completa en una nueva pestaña"
                >
                  <ExternalLink className="w-4 h-4 text-cyan-400" />
                  <span>Ver en Pestaña</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadCertificateHtml(certificateData)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer shrink-0"
                  title="Descargar archivo HTML autónomo"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Descargar HTML</span>
                </button>
              </div>
            </div>

            {/* Print Configuration Hint Banner */}
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/60 text-xs text-cyan-200">
              <span className="text-base shrink-0">💡</span>
              <div className="space-y-0.5">
                <strong className="text-cyan-300 font-semibold block">
                  Ajustado para 1 Sola Hoja (Diseño Horizontal A4):
                </strong>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  El sistema fuerza automáticamente el modo <strong>Horizontal (Landscape)</strong> y márgenes a 0mm para que encaje en una única página. En la ventana de tu navegador, asegúrate de tener marcada la opción <strong>«Gráficos de fondo»</strong> (Background graphics) para que los colores y sellos de seguridad queden impresos.
                </p>
              </div>
            </div>
          </div>

          {/* Graphical Certificate Preview Card */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Previsualización del Diploma (A4 Paisaje)</span>
              </span>
              <span className="font-mono text-[11px] text-slate-500">ID: {serialNumber}</span>
            </div>

            <div className="relative border-2 border-cyan-800/80 rounded-xl bg-slate-950 p-6 sm:p-8 text-center overflow-hidden shadow-2xl">
              {/* Subtle background glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/20 via-transparent to-slate-950/60 pointer-events-none" />

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between border-b border-cyan-900/60 pb-3 text-left">
                  <div>
                    <span className="text-[11px] tracking-widest uppercase font-bold text-cyan-400 block font-serif">
                      UN FANTASMA EN EL SISTEMA &middot; CTF ACADEMY
                    </span>
                    <span className="text-[10px] text-slate-400">Certificación Oficial de Hacking Ético</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{dateStr}</span>
                </div>

                <div className="py-2 space-y-1">
                  <span className="text-xs uppercase tracking-widest text-slate-400 block">
                    Certificado de Superación
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-serif font-extrabold text-white tracking-wide">
                    {studentName || 'Auditor Anónimo'}
                  </h3>
                  <p className="text-xs text-slate-300 max-w-xl mx-auto pt-1 leading-relaxed">
                    Por haber superado con éxito el laboratorio técnico de auditoría y pentesting recuperando las banderas de usuario y root en el entorno:
                  </p>
                </div>

                <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs">
                  <span className="font-bold text-cyan-400">{scenario.themeName}</span>
                  <span className="text-slate-600">·</span>
                  <span className="font-mono text-slate-300">{scenario.codename}</span>
                  <span className="text-slate-600">·</span>
                  <span className="font-semibold text-amber-400">Dificultad: {scenario.difficulty}</span>
                </div>

                {/* Bottom Signatures & Seal */}
                <div className="pt-4 border-t border-cyan-900/50 flex items-center justify-between text-left">
                  <div className="space-y-0.5">
                    <div className="w-28 h-px bg-slate-700" />
                    <span className="text-[10px] font-bold text-slate-300 block">Dirección Técnica</span>
                    <span className="text-[9px] text-slate-500 block">Un Fantasma En El Sistema</span>
                  </div>

                  <div className="w-12 h-12 rounded-full border border-cyan-500/80 bg-cyan-950/40 flex flex-col items-center justify-center shadow-lg shadow-cyan-950">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span className="text-[7px] font-bold text-cyan-300 tracking-wider">VERIFIED</span>
                  </div>

                  <div className="space-y-0.5 text-right">
                    <div className="w-28 h-px bg-slate-700 ml-auto" />
                    <span className="text-[10px] font-bold text-slate-300 block">Sello de Laboratorio</span>
                    <span className="text-[9px] text-slate-500 block">NetPhantom CTF</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cryptographic SHA-256 Stamp Box */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Hash className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sello Criptográfico SHA-256 de Verificación:</span>
              </div>
              <p className="text-[11px] font-mono text-cyan-300/90 break-all select-all">
                {sha256Hash || 'Calculando firma criptográfica...'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyHash}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors shrink-0 cursor-pointer"
            >
              {copiedHash ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Hash</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/70">
          <span className="text-xs text-slate-500">
            Los diplomas emitidos son verificables mediante el hash criptográfico único.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
