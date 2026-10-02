import { CTFScenario } from '../types';

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export interface CertificateData {
  studentName: string;
  scenario: CTFScenario;
  dateStr: string;
  serialNumber: string;
  sha256Hash: string;
}

export async function computeCertificateHash(
  studentName: string,
  scenario: CTFScenario,
  timestampStr: string
): Promise<string> {
  const rawString = `NETPHANTOM_CTF_ACADEMY::${studentName.trim()}::${scenario.codename}::${scenario.difficulty}::${scenario.userFlag}::${scenario.rootFlag}::${timestampStr}`;
  const msgBuffer = new TextEncoder().encode(rawString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateCertificateHtml(data: CertificateData): string {
  const studentName = escapeHtml(data.studentName);
  const scenario = data.scenario;
  const dateStr = escapeHtml(data.dateStr);
  const serialNumber = escapeHtml(data.serialNumber);
  const sha256Hash = escapeHtml(data.sha256Hash);
  const codename = escapeHtml(scenario.codename || '');
  const themeName = escapeHtml(scenario.themeName || '');
  const difficultyLabel = escapeHtml(scenario.difficulty || '');
  const ip = escapeHtml(scenario.ip || '');
  const userFlagPreview = escapeHtml((scenario.userFlag || '').slice(0, 10));
  const rootFlagPreview = escapeHtml((scenario.rootFlag || '').slice(0, 10));

  const difficultyColors: Record<string, { badgeBg: string; text: string; border: string }> = {
    Easy: { badgeBg: '#064e3b', text: '#34d399', border: '#059669' },
    Medium: { badgeBg: '#78350f', text: '#fbbf24', border: '#d97706' },
    Hard: { badgeBg: '#7c2d12', text: '#fb923c', border: '#ea580c' },
    Insane: { badgeBg: '#881337', text: '#fb7185', border: '#e11d48' },
  };

  const diffStyle = difficultyColors[scenario.difficulty] || difficultyColors.Medium;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificado Oficial CTF - ${studentName} - ${codename}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap');

    /* STRICT Paged Media orientation rules */
    @page {
      size: A4 landscape;
      size: landscape;
      margin: 0mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    html, body {
      width: 297mm;
      height: 210mm;
      max-width: 297mm;
      max-height: 210mm;
      background-color: #030712;
      color: #f8fafc;
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }

    body {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .certificate-sheet {
      width: 297mm;
      height: 210mm;
      max-width: 297mm;
      max-height: 210mm;
      background: radial-gradient(circle at 50% 50%, #08111e 0%, #030712 100%);
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 24px 38px;
      overflow: hidden;
      page-break-after: avoid !important;
      page-break-inside: avoid !important;
      break-after: avoid !important;
      break-inside: avoid !important;
    }

    /* Guilloché security outer frame */
    .outer-border {
      position: absolute;
      inset: 10px;
      border: 2px solid #0284c7;
      pointer-events: none;
    }

    .inner-border {
      position: absolute;
      inset: 15px;
      border: 1px dashed rgba(56, 189, 248, 0.4);
      pointer-events: none;
    }

    .corner-motif {
      position: absolute;
      width: 26px;
      height: 26px;
      border-color: #38bdf8;
      pointer-events: none;
    }

    .top-left { top: 9px; left: 9px; border-top: 3px solid #38bdf8; border-left: 3px solid #38bdf8; }
    .top-right { top: 9px; right: 9px; border-top: 3px solid #38bdf8; border-right: 3px solid #38bdf8; }
    .bottom-left { bottom: 9px; left: 9px; border-bottom: 3px solid #38bdf8; border-left: 3px solid #38bdf8; }
    .bottom-right { bottom: 9px; right: 9px; border-bottom: 3px solid #38bdf8; border-right: 3px solid #38bdf8; }

    /* Header */
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      z-index: 10;
      border-bottom: 1px solid rgba(56, 189, 248, 0.25);
      padding-bottom: 8px;
    }

    .brand-title {
      font-family: 'Cinzel', serif;
      font-size: 13px;
      letter-spacing: 3px;
      color: #38bdf8;
      font-weight: 700;
      text-transform: uppercase;
    }

    .serial-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9.5px;
      color: #94a3b8;
      letter-spacing: 1px;
    }

    /* Main Certificate Core */
    .cert-body {
      text-align: center;
      position: relative;
      z-index: 10;
      padding: 4px 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .title-diploma {
      font-family: 'Cinzel', serif;
      font-size: 26px;
      font-weight: 900;
      letter-spacing: 4px;
      background: linear-gradient(135deg, #ffffff 0%, #bae6fd 60%, #38bdf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-transform: uppercase;
      margin-bottom: 2px;
      line-height: 1.2;
    }

    .subtitle-award {
      font-size: 9.5px;
      text-transform: uppercase;
      letter-spacing: 3.5px;
      color: #94a3b8;
      font-weight: 500;
      margin-bottom: 8px;
    }

    .recipient-intro {
      font-size: 11px;
      color: #cbd5e1;
      font-style: italic;
      margin-bottom: 3px;
    }

    .recipient-name {
      font-family: 'Cinzel', serif;
      font-size: 28px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 2px;
      padding: 2px 20px;
      display: inline-block;
      border-bottom: 2px solid #0284c7;
      margin-bottom: 8px;
      text-shadow: 0 0 20px rgba(56, 189, 248, 0.4);
      line-height: 1.2;
    }

    .achievement-description {
      font-size: 11.5px;
      color: #e2e8f0;
      max-width: 660px;
      margin: 0 auto 8px;
      line-height: 1.45;
    }

    .machine-badge-box {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid #334155;
      padding: 5px 16px;
      border-radius: 9999px;
      margin-bottom: 8px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.5);
    }

    .machine-codename {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11.5px;
      font-weight: 700;
      color: #38bdf8;
    }

    .machine-difficulty {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 9999px;
      background-color: ${diffStyle.badgeBg};
      color: ${diffStyle.text};
      border: 1px solid ${diffStyle.border};
      text-transform: uppercase;
    }

    .flags-validated-tag {
      font-size: 10px;
      color: #34d399;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-weight: 600;
    }

    /* Footer / Signatures / Stamp */
    .cert-footer {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: flex-end;
      gap: 16px;
      position: relative;
      z-index: 10;
      border-top: 1px solid rgba(56, 189, 248, 0.2);
      padding-top: 8px;
    }

    .signature-block {
      text-align: center;
    }

    .sig-line {
      width: 150px;
      height: 1px;
      background: #475569;
      margin: 0 auto 4px;
    }

    .sig-name {
      font-size: 10px;
      font-weight: 700;
      color: #f1f5f9;
    }

    .sig-title {
      font-size: 8.5px;
      color: #94a3b8;
    }

    /* Cyber Security Seal (Center) */
    .cyber-seal {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      border: 2px solid #38bdf8;
      background: radial-gradient(circle, #0c4a6e 0%, #030712 90%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 20px rgba(56, 189, 248, 0.35);
      margin: 0 auto;
    }

    .seal-text {
      font-size: 6.5px;
      font-weight: 800;
      color: #38bdf8;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      text-align: center;
    }

    .seal-icon {
      font-size: 13px;
      color: #f8fafc;
      margin: 1px 0;
    }

    /* Cryptographic Stamp at bottom */
    .hash-ribbon {
      grid-column: 1 / -1;
      text-align: center;
      font-family: 'JetBrains Mono', monospace;
      font-size: 7.5px;
      color: #64748b;
      margin-top: 4px;
      letter-spacing: 0.5px;
      word-break: break-all;
    }

    .hash-ribbon strong {
      color: #38bdf8;
    }

    .disclaimer-note {
      grid-column: 1 / -1;
      text-align: center;
      font-family: 'Inter', sans-serif;
      font-size: 6.5px;
      color: #94a3b8;
      margin-top: 3px;
      line-height: 1.4;
      max-width: 620px;
      margin-left: auto;
      margin-right: auto;
    }

    /* Print media query - forces exact single sheet */
    @media print {
      @page {
        size: A4 landscape;
        size: landscape;
        margin: 0mm;
      }

      html, body {
        width: 297mm !important;
        height: 210mm !important;
        max-width: 297mm !important;
        max-height: 210mm !important;
        background-color: #030712 !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        page-break-after: avoid !important;
        page-break-inside: avoid !important;
        break-after: avoid !important;
        break-inside: avoid !important;
      }

      .certificate-sheet {
        width: 297mm !important;
        height: 210mm !important;
        max-width: 297mm !important;
        max-height: 210mm !important;
        box-sizing: border-box !important;
        padding: 24px 38px !important;
        box-shadow: none !important;
        border: none !important;
        overflow: hidden !important;
        page-break-after: avoid !important;
        page-break-inside: avoid !important;
        break-after: avoid !important;
        break-inside: avoid !important;
      }
    }
  </style>
</head>
<body>
  <div class="certificate-sheet">
    <div class="outer-border"></div>
    <div class="inner-border"></div>
    <div class="corner-motif top-left"></div>
    <div class="corner-motif top-right"></div>
    <div class="corner-motif bottom-left"></div>
    <div class="corner-motif bottom-right"></div>

    <!-- Header -->
    <div class="header-bar">
      <div class="brand-title">UN FANTASMA EN EL SISTEMA &middot; CTF ACADEMY</div>
      <div class="serial-tag">CERTIFICADO ID: ${serialNumber}</div>
    </div>

    <!-- Body -->
    <div class="cert-body">
      <h1 class="title-diploma">Certificado de Superación</h1>
      <div class="subtitle-award">HACKING ÉTICO &bull; SEGURIDAD OFENSIVA &bull; AUDITORÍA TÉCNICA</div>

      <p class="recipient-intro">Diploma autoemitido de práctica que acredita que el auditor / estudiante</p>
      <div class="recipient-name">${studentName}</div>

      <p class="achievement-description">
        Ha superado con éxito el laboratorio técnico de ciberseguridad ofensiva, identificando las vulnerabilidades de vector inicial, ejecutando la escalada de privilegios y recuperando las banderas de usuario y root bajo las directrices de la plataforma.
      </p>

      <div class="machine-badge-box">
        <span class="machine-codename">${themeName} (${codename})</span>
        <span class="machine-difficulty">Dificultad: ${difficultyLabel}</span>
        <span class="serial-tag">IP: ${ip}</span>
      </div>

      <div class="flags-validated-tag">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>Banderas Verificadas: user.txt (${userFlagPreview}...) y root.txt (${rootFlagPreview}...)</span>
      </div>
    </div>

    <!-- Footer -->
    <div class="cert-footer">
      <div class="signature-block">
        <div class="sig-line"></div>
        <div class="sig-name">Director Técnico de Laboratorios</div>
        <div class="sig-title">Un Fantasma En El Sistema</div>
      </div>

      <div class="cyber-seal">
        <div class="seal-text">AUTOEMITIDO</div>
        <div class="seal-icon">🛡️</div>
        <div class="seal-text">NETPHANTOM</div>
      </div>

      <div class="signature-block">
        <div class="sig-line"></div>
        <div class="sig-name">Fecha de Emisión</div>
        <div class="sig-title">${dateStr}</div>
      </div>

      <div class="hash-ribbon">
        Código de verificación (SHA-256, generado localmente): <strong>${sha256Hash}</strong>
      </div>
      <div class="disclaimer-note">
        Diploma autoemitido de carácter formativo, generado localmente en tu navegador. No constituye una certificación
        profesional oficial ni una acreditación de terceros: es un registro simbólico de práctica para tu propio seguimiento.
      </div>
    </div>
  </div>

  <script>
    if (window.location.hash === '#print') {
      window.onload = function() {
        setTimeout(function() {
          window.print();
        }, 500);
      };
    }
  </script>
</body>
</html>`;
}

/**
 * Opens print dialog for the certificate using a hidden iframe
 * ensuring strict @page size: landscape rules are respected and fits on 1 sheet.
 */
export function printCertificateAsPdf(data: CertificateData): void {
  const html = generateCertificateHtml(data);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  // No doc.write(): the certificate is handed to the iframe via srcdoc, and
  // the iframe is sandboxed without 'allow-scripts', so the inline #print
  // helper script embedded in the standalone download never runs here.
  iframe.setAttribute('sandbox', 'allow-same-origin allow-modals');
  iframe.srcdoc = html;

  iframe.onload = () => {
    // Allow Google Fonts to render before triggering print
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.warn('Iframe print error, falling back to a new tab:', e);
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const win = window.open(url, '_blank', 'noopener,noreferrer');
        if (win) {
          setTimeout(() => {
            win.print();
            URL.revokeObjectURL(url);
          }, 500);
        } else {
          URL.revokeObjectURL(url);
        }
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
        }, 2000);
      }
    }, 450);
  };

  document.body.appendChild(iframe);
}

/**
 * Downloads standalone certificate HTML
 */
export function downloadCertificateHtml(data: CertificateData): void {
  const html = generateCertificateHtml(data);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Certificado_${data.studentName.replace(/\s+/g, '_')}_${data.scenario.codename}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
