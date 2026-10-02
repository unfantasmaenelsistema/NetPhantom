import { CTFScenario } from '../types';
import { getScenarioFrameworks } from './frameworksHelper';
import { calculateCVSS31, inferCVSSVector } from './cvssCalculator';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatInlineMarkdown(text: string): string {
  let res = escapeHtml(text);
  // Bold: **text**
  res = res.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic: *text*
  res = res.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Inline code: `code`
  res = res.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  return res;
}

export function formatMarkdownToHtml(markdown: string): string {
  if (!markdown) return '<p class="writeup-p">No hay guía disponible.</p>';

  // Normalize line endings
  const normalized = markdown.replace(/\r\n/g, '\n');

  // Extract all code blocks first (e.g. ```bash ... ```)
  const codeBlocks: string[] = [];
  const withPlaceholders = normalized.replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const langDisplay = (lang || 'TERMINAL').trim().toUpperCase();
    const cleanCode = escapeHtml(code.trim());
    const placeholder = `__NETPHANTOM_CODE_BLOCK_${codeBlocks.length}__`;

    codeBlocks.push(`
      <div class="code-window">
        <div class="code-window-bar">
          <div class="code-window-controls">
            <span class="control-dot dot-red"></span>
            <span class="control-dot dot-yellow"></span>
            <span class="control-dot dot-green"></span>
          </div>
          <span class="code-window-title">${langDisplay}</span>
        </div>
        <pre><code>${cleanCode}</code></pre>
      </div>
    `);

    return `\n\n${placeholder}\n\n`;
  });

  // Now process lines
  const lines = withPlaceholders.split('\n');
  const output: string[] = [];
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) {
      output.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      output.push('</ol>');
      inOl = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      closeLists();
      continue;
    }

    // Code block placeholder
    if (trimmed.startsWith('__NETPHANTOM_CODE_BLOCK_') && trimmed.endsWith('__')) {
      closeLists();
      output.push(trimmed);
      continue;
    }

    // Horizontal Rule
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
      closeLists();
      output.push('<hr class="writeup-divider" />');
      continue;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      closeLists();
      output.push(`<h5 class="writeup-h3">${formatInlineMarkdown(trimmed.slice(4))}</h5>`);
      continue;
    }
    if (trimmed.startsWith('## ')) {
      closeLists();
      output.push(`<h4 class="writeup-h2">${formatInlineMarkdown(trimmed.slice(3))}</h4>`);
      continue;
    }
    if (trimmed.startsWith('# ')) {
      closeLists();
      output.push(`<h3 class="writeup-h1">${formatInlineMarkdown(trimmed.slice(2))}</h3>`);
      continue;
    }

    // Unordered lists (- or *)
    if (/^[-*]\s+/.test(trimmed)) {
      if (inOl) {
        output.push('</ol>');
        inOl = false;
      }
      if (!inUl) {
        output.push('<ul class="writeup-list">');
        inUl = true;
      }
      const content = trimmed.replace(/^[-*]\s+/, '');
      output.push(`<li>${formatInlineMarkdown(content)}</li>`);
      continue;
    }

    // Ordered lists (1. , 2. )
    if (/^\d+\.\s+/.test(trimmed)) {
      if (inUl) {
        output.push('</ul>');
        inUl = false;
      }
      if (!inOl) {
        output.push('<ol class="writeup-list ordered">');
        inOl = true;
      }
      const content = trimmed.replace(/^\d+\.\s+/, '');
      output.push(`<li>${formatInlineMarkdown(content)}</li>`);
      continue;
    }

    // Regular paragraph
    closeLists();
    output.push(`<p class="writeup-p">${formatInlineMarkdown(trimmed)}</p>`);
  }

  closeLists();

  let resultHtml = output.join('\n');

  // Replace placeholders with real terminal code windows
  codeBlocks.forEach((blockHtml, index) => {
    resultHtml = resultHtml.replace(`__NETPHANTOM_CODE_BLOCK_${index}__`, blockHtml);
  });

  return resultHtml;
}

export function generateHtmlReport(scenario: CTFScenario): string {
  const code = scenario.codename || 'CTF_LAB';
  const theme = scenario.themeName || 'Escenario CTF';
  const difficulty = scenario.difficulty || 'Medium';
  const os = scenario.targetOS || 'Debian 12 Bookworm';
  const ip = scenario.ip || '10.10.110.42';
  const vector = scenario.vector || 'Vulnerabilidad web';
  const privesc = scenario.secondaryVector || 'Escalada local';
  const dateStr = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const diffColors: Record<string, { bg: string; text: string; border: string }> = {
    Easy: { bg: '#ecfdf5', text: '#047857', border: '#10b981' },
    Medium: { bg: '#fffbeb', text: '#b45309', border: '#f59e0b' },
    Hard: { bg: '#fff7ed', text: '#c2410c', border: '#f97316' },
    Insane: { bg: '#fff1f2', text: '#be123c', border: '#f43f5e' },
  };

  const diffBadge = diffColors[difficulty] || diffColors.Medium;
  const frameworks = getScenarioFrameworks(scenario);
  const cvssResult = calculateCVSS31(inferCVSSVector(scenario));
  const cvssColor =
    cvssResult.severity === 'Critical'
      ? '#e11d48'
      : cvssResult.severity === 'High'
      ? '#ea580c'
      : cvssResult.severity === 'Medium'
      ? '#d97706'
      : '#059669';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dossier Técnico CTF - ${theme} (${code})</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #06b6d4;
      --primary-dark: #0891b2;
      --accent: #3b82f6;
      --bg: #ffffff;
      --surface: #f8fafc;
      --surface-subtle: #f1f5f9;
      --border: #e2e8f0;
      --border-strong: #cbd5e1;
      --text: #0f172a;
      --text-muted: #64748b;
      --text-light: #94a3b8;
      --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: #f1f5f9;
      color: var(--text);
      font-family: var(--font-sans);
      line-height: 1.6;
      padding: 30px 15px;
      -webkit-font-smoothing: antialiased;
    }

    .report-container {
      max-width: 900px;
      margin: 0 auto;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
      overflow: hidden;
      position: relative;
    }

    /* Floating Action Bar for Web View */
    .screen-actions {
      position: sticky;
      top: 15px;
      z-index: 100;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 10px 20px;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      color: #ffffff;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }

    .btn-primary {
      background: #06b6d4;
      color: #0b0f19;
    }
    .btn-primary:hover {
      background: #22d3ee;
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: #f8fafc;
      border-color: rgba(255, 255, 255, 0.2);
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Document Header */
    .doc-header {
      padding: 40px 45px 30px;
      border-bottom: 2px solid var(--border);
      background: linear-gradient(to bottom, #ffffff, var(--surface));
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
    }

    .brand-block {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .brand-icon {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      background: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #38bdf8;
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 20px;
      border: 1px solid #1e293b;
    }

    .brand-text h2 {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
    }

    .brand-text span {
      font-size: 12px;
      color: var(--text-muted);
      font-family: var(--font-mono);
      display: block;
    }

    .classification-badge {
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 4px;
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #f87171;
      letter-spacing: 0.05em;
    }

    .doc-title {
      font-size: 26px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.25;
      margin-bottom: 8px;
      letter-spacing: -0.02em;
    }

    .doc-subtitle {
      font-size: 14px;
      color: var(--text-muted);
      margin-bottom: 25px;
    }

    /* Meta Grid Table */
    .meta-grid {
      display: grid;
      grid-cols: repeat(4, 1fr);
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      background: #ffffff;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid var(--border);
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .meta-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--text-muted);
      font-family: var(--font-mono);
      letter-spacing: 0.04em;
    }

    .meta-value {
      font-size: 13px;
      font-weight: 700;
      color: var(--text);
    }

    .meta-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-family: var(--font-mono);
      font-weight: 700;
      border: 1px solid ${diffBadge.border};
      background: ${diffBadge.bg};
      color: ${diffBadge.text};
      width: fit-content;
    }

    /* Document Body */
    .doc-body {
      padding: 40px 45px;
    }

    .section {
      margin-bottom: 35px;
      page-break-inside: avoid;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border);
    }

    .section-number {
      font-family: var(--font-mono);
      font-size: 12px;
      font-weight: 700;
      color: var(--primary-dark);
      background: #ecfeff;
      border: 1px solid #a5f3fc;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .section-title {
      font-size: 17px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.01em;
    }

    .lead-text {
      font-size: 14px;
      color: #334155;
      line-height: 1.7;
      margin-bottom: 12px;
    }

    /* Attack Surface Table */
    .table-container {
      width: 100%;
      overflow-x: auto;
      border: 1px solid var(--border);
      border-radius: 8px;
      margin-top: 10px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      text-align: left;
    }

    th {
      background: var(--surface);
      color: #334155;
      font-weight: 700;
      padding: 10px 14px;
      border-bottom: 1px solid var(--border);
      font-family: var(--font-mono);
      font-size: 11px;
      text-transform: uppercase;
    }

    td {
      padding: 10px 14px;
      border-bottom: 1px solid var(--border);
      color: #1e293b;
    }

    tr:last-child td {
      border-bottom: none;
    }

    tr:nth-child(even) td {
      background: #fafafa;
    }

    .port-tag {
      font-family: var(--font-mono);
      font-weight: 700;
      color: #0369a1;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
    }

    /* Topology visual schematic */
    .topology-schematic {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin: 15px 0;
    }

    .topo-node {
      border: 1px solid var(--border);
      background: var(--surface);
      border-radius: 8px;
      padding: 12px;
      text-align: center;
      position: relative;
    }

    .topo-node-title {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .topo-node-role {
      font-size: 11px;
      color: var(--text-muted);
      font-family: var(--font-mono);
    }

    /* Attack Vectors Highlight Cards */
    .vector-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-top: 10px;
    }

    .vector-card {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      background: #ffffff;
      border-left: 4px solid var(--primary-dark);
    }

    .vector-card.privesc {
      border-left-color: #f59e0b;
    }

    .vector-badge {
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--primary-dark);
      margin-bottom: 4px;
      display: block;
    }

    .vector-card.privesc .vector-badge {
      color: #b45309;
    }

    .vector-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.4;
    }

    /* Flags Block */
    .flags-block {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-top: 10px;
    }

    .flag-card {
      background: #0f172a;
      color: #f8fafc;
      border-radius: 8px;
      padding: 14px 16px;
      font-family: var(--font-mono);
    }

    .flag-label {
      font-size: 11px;
      color: #94a3b8;
      display: block;
      margin-bottom: 4px;
    }

    .flag-value {
      font-size: 13px;
      font-weight: 700;
      color: #38bdf8;
      word-break: break-all;
      background: rgba(0, 0, 0, 0.3);
      padding: 6px 8px;
      border-radius: 4px;
      border: 1px solid #1e293b;
      margin-top: 4px;
      display: block;
    }

    .flag-path {
      font-size: 10px;
      color: #64748b;
      margin-top: 6px;
      display: block;
    }

    /* Hints Matrix */
    .hints-matrix {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 10px;
    }

    .hint-row {
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 12px 14px;
      background: #ffffff;
      display: flex;
      gap: 12px;
    }

    .hint-level {
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      white-space: nowrap;
      height: fit-content;
    }

    .level-1 { background: #ecfeff; color: #0891b2; border: 1px solid #bae6fd; }
    .level-2 { background: #fffbeb; color: #b45309; border: 1px solid #fed7aa; }
    .level-3 { background: #fff1f2; color: #e11d48; border: 1px solid #fecdd3; }

    .hint-content h6 {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 2px;
    }

    .hint-content p {
      font-size: 12px;
      color: #475569;
      line-height: 1.5;
    }

    /* Code Blocks & Terminal Windows */
    .code-window {
      background: #0b0f19;
      border: 1px solid #1e293b;
      border-radius: 8px;
      margin: 14px 0 16px;
      overflow: hidden;
      box-shadow: 0 4px 10px -2px rgba(0, 0, 0, 0.15);
      page-break-inside: avoid;
    }

    .code-window-bar {
      background: #111827;
      padding: 8px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #1f2937;
    }

    .code-window-controls {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .control-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
    }

    .dot-red { background: #ef4444; }
    .dot-yellow { background: #f59e0b; }
    .dot-green { background: #10b981; }

    .code-window-title {
      font-family: var(--font-mono);
      font-size: 10.5px;
      font-weight: 700;
      color: #94a3b8;
      letter-spacing: 0.06em;
    }

    .code-window pre {
      margin: 0;
      padding: 14px 16px;
      background: transparent;
      border: none;
      border-radius: 0;
      font-family: var(--font-mono);
      font-size: 12.5px;
      line-height: 1.6;
      color: #38bdf8;
      overflow-x: auto;
    }

    .code-window code {
      background: transparent;
      border: none;
      padding: 0;
      color: inherit;
      font-size: inherit;
    }

    /* Writeup Formatted Typography */
    .writeup-container {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 24px 28px;
      font-family: var(--font-sans);
    }

    .writeup-h1 {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 10px;
      margin-bottom: 14px;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--border);
      letter-spacing: -0.01em;
    }

    .writeup-h2 {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 24px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .writeup-h3 {
      font-size: 13.5px;
      font-weight: 700;
      color: #1e293b;
      margin-top: 16px;
      margin-bottom: 6px;
    }

    .writeup-p {
      font-size: 13.5px;
      color: #334155;
      line-height: 1.7;
      margin-bottom: 10px;
    }

    .writeup-list {
      margin: 8px 0 14px 24px;
      color: #334155;
      font-size: 13.5px;
      line-height: 1.65;
    }

    .writeup-list li {
      margin-bottom: 5px;
    }

    .inline-code {
      font-family: var(--font-mono);
      font-size: 11.5px;
      background: #f1f5f9;
      color: #0369a1;
      border: 1px solid #cbd5e1;
      padding: 1.5px 5px;
      border-radius: 4px;
      font-weight: 600;
    }

    .writeup-divider {
      border: 0;
      height: 1px;
      background: var(--border);
      margin: 22px 0;
    }

    pre {
      background: #0f172a;
      color: #e2e8f0;
      padding: 14px 16px;
      border-radius: 8px;
      font-family: var(--font-mono);
      font-size: 12px;
      line-height: 1.5;
      overflow-x: auto;
      margin: 10px 0;
      border: 1px solid #1e293b;
    }

    code {
      font-family: var(--font-mono);
      font-size: 12px;
      background: var(--surface-subtle);
      padding: 2px 5px;
      border-radius: 4px;
      color: #0369a1;
      border: 1px solid var(--border);
    }

    pre code {
      background: transparent;
      padding: 0;
      border: none;
      color: inherit;
    }

    /* Document Footer */
    .doc-footer {
      padding: 25px 45px 35px;
      background: var(--surface);
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: var(--text-muted);
    }

    .footer-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .footer-link {
      color: var(--primary-dark);
      text-decoration: none;
      font-weight: 600;
    }
    .footer-link:hover {
      text-decoration: underline;
    }

    /* Print Styles (PDF Generation) */
    @media print {
      body {
        background: #ffffff;
        color: #000000;
        padding: 0;
      }

      .screen-actions {
        display: none !important;
      }

      .report-container {
        border: none;
        box-shadow: none;
        max-width: 100%;
        margin: 0;
        border-radius: 0;
      }

      .doc-header {
        padding: 25px 25px 15px;
        background: #ffffff;
        border-bottom: 2px solid #000000;
      }

      .doc-body {
        padding: 20px 25px;
      }

      .doc-footer {
        padding: 15px 25px;
        border-top: 1px solid #cccccc;
      }

      .section {
        page-break-inside: avoid;
        margin-bottom: 25px;
      }

      .page-break {
        page-break-before: always;
      }

      pre, .flag-card {
        border: 1px solid #475569 !important;
        background: #0f172a !important;
        color: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .meta-grid, table, .vector-card, .hint-row {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }

    @media (max-width: 640px) {
      .doc-header, .doc-body, .doc-footer {
        padding: 20px 16px;
      }
      .meta-grid {
        grid-template-columns: 1fr 1fr;
      }
      .topology-schematic, .vector-grid, .flags-block {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>

  <div class="report-container">
    <!-- Floating Web Action Bar -->
    <div class="screen-actions">
      <span style="font-size: 12px; margin-right: auto; align-self: center; opacity: 0.8;">
        👻 NetPhantom CTF · Dossier Oficial de Laboratorio
      </span>
      <button class="btn btn-secondary" onclick="window.print()">
        🖨️ Imprimir / Guardar en PDF
      </button>
      <a class="btn btn-primary" href="https://www.unfantasmaenelsistema.com/" target="_blank" rel="noopener noreferrer">
        🌐 Un Fantasma En El Sistema
      </a>
    </div>

    <!-- Document Header -->
    <header class="doc-header">
      <div class="header-top">
        <div class="brand-block">
          <div class="brand-icon">UF</div>
          <div class="brand-text">
            <h2>UN FANTASMA EN EL SISTEMA</h2>
            <span>Comunidad de Hacking Ético & Ciberseguridad</span>
          </div>
        </div>
        <div class="classification-badge">
          Laboratorio CTF Oficial
        </div>
      </div>

      <h1 class="doc-title">${theme}</h1>
      <p class="doc-subtitle">
        Documento técnico de especificación de reto, análisis de superficie de ataque, provisionamiento Docker y solución auditada.
      </p>

      <!-- Metadata Grid -->
      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">Identificador (Codename)</span>
          <span class="meta-value" style="font-family: var(--font-mono); color: var(--primary-dark);">${code}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Dificultad Estimada</span>
          <span class="meta-badge">${difficulty}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Sistema Operativo</span>
          <span class="meta-value">${os}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">IP Simulada</span>
          <span class="meta-value" style="font-family: var(--font-mono);">${ip}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Severidad CVSS v3.1</span>
          <span class="meta-value" style="color: ${cvssColor}; font-weight: 800;">${cvssResult.score.toFixed(1)} ${cvssResult.severity}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Vector Foothold</span>
          <span class="meta-value" style="font-size: 11px;">${vector}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Escalada PrivEsc</span>
          <span class="meta-value" style="font-size: 11px;">${privesc}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Fecha de Auditoría</span>
          <span class="meta-value">${dateStr}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Plataforma</span>
          <span class="meta-value" style="color: #059669; font-weight: 700;">Docker Compose v2</span>
        </div>
      </div>
    </header>

    <!-- Main Content Body -->
    <main class="doc-body">
      <!-- 1. Contexto Narrativo -->
      <section class="section">
        <div class="section-header">
          <span class="section-number">01</span>
          <h3 class="section-title">Contexto Narrativo & Sinopsis del Reto</h3>
        </div>
        <p class="lead-text" style="white-space: pre-line;">${scenario.story}</p>
      </section>

      <!-- 2. Arquitectura & Topología -->
      <section class="section">
        <div class="section-header">
          <span class="section-number">02</span>
          <h3 class="section-title">Topología de Red & Arquitectura de Segmentación</h3>
        </div>
        <p class="lead-text">
          El laboratorio implementa una red puente aislada (<code style="color: var(--primary-dark)">10.10.110.0/24</code>) para garantizar que los artefactos y vectores de ataque no afecten a la red anfitriona:
        </p>

        <div class="topology-schematic">
          <div class="topo-node" style="border-top: 3px solid #3b82f6;">
            <div class="topo-node-title">Atacante (Kali)</div>
            <div class="topo-node-role">10.10.14.5 · Auditor</div>
          </div>
          <div class="topo-node" style="border-top: 3px solid #f59e0b;">
            <div class="topo-node-title">Firewall DMZ</div>
            <div class="topo-node-role">Segmentación Perímetro</div>
          </div>
          <div class="topo-node" style="border-top: 3px solid #06b6d4;">
            <div class="topo-node-title">${code}</div>
            <div class="topo-node-role">${ip} · Target</div>
          </div>
          <div class="topo-node" style="border-top: 3px solid #ef4444;">
            <div class="topo-node-title">Bóveda Root</div>
            <div class="topo-node-role">Bandera Final /root</div>
          </div>
        </div>
      </section>

      <!-- 3. Superficie de Red & Puertos -->
      <section class="section">
        <div class="section-header">
          <span class="section-number">03</span>
          <h3 class="section-title">Superficie de Red & Matriz de Puertos Expuestos</h3>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Puerto</th>
                <th>Servicio</th>
                <th>Versión Detectada</th>
                <th>Función en el Escenario</th>
              </tr>
            </thead>
            <tbody>
              ${(scenario.openPorts || [])
                .map(
                  (p) => `
                <tr>
                  <td><span class="port-tag">${p.port}/tcp</span></td>
                  <td><strong>${p.service}</strong></td>
                  <td style="font-family: var(--font-mono); font-size: 11px;">${p.version}</td>
                  <td>${p.purpose}</td>
                </tr>`
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </section>

      <!-- 4. Vectores de Ataque -->
      <section class="section">
        <div class="section-header">
          <span class="section-number">04</span>
          <h3 class="section-title">Matriz de Vectores de Ataque Identificados</h3>
        </div>
        <div class="vector-grid">
          <div class="vector-card">
            <span class="vector-badge">Fase 1 · Acceso Inicial (Foothold)</span>
            <div class="vector-title">${vector}</div>
            <p style="font-size: 12px; color: var(--text-muted); margin-top: 6px;">
              Permite la explotación externa para lograr ejecución de código remoto (RCE) u obtención de credenciales bajo cuenta restringida.
            </p>
          </div>
          <div class="vector-card privesc">
            <span class="vector-badge">Fase 2 · Escalada Local (PrivEsc)</span>
            <div class="vector-title">${privesc}</div>
            <p style="font-size: 12px; color: var(--text-muted); margin-top: 6px;">
              Vulnerabilidad de configuración o permisos en el sistema operativo para obtener privilegios absolutos de superusuario (root).
            </p>
          </div>
        </div>
      </section>

      <!-- 5. Marcos Estándar de la Industria (MITRE ATT&CK & OWASP) -->
      <section class="section">
        <div class="section-header">
          <span class="section-number">05</span>
          <h3 class="section-title">Alineación con Marcos Estándar de la Industria (MITRE ATT&CK & OWASP)</h3>
        </div>
        <p class="lead-text">
          Taxonomía estandarizada para equipos Red Team, auditores y analistas SOC según matrices internacionales de ciberseguridad:
        </p>

        <!-- CVSS v3.1 Executive Scorecard -->
        <div style="background: var(--surface-subtle); border: 1px solid var(--border); border-left: 4px solid ${cvssColor}; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div>
              <span style="font-size: 11px; font-family: var(--font-mono); text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Calificación de Severidad (FIRST.org CVSS v3.1)</span>
              <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 2px;">
                Puntuación Base: <span style="color: ${cvssColor};">${cvssResult.score.toFixed(1)} / 10</span> (${cvssResult.severity})
              </div>
            </div>
            <div style="font-family: var(--font-mono); font-size: 11px; background: #ffffff; border: 1px solid var(--border); padding: 4px 10px; border-radius: 6px;">
              Explotabilidad: <strong>${cvssResult.exploitability}</strong> &middot; Impacto: <strong>${cvssResult.impact}</strong>
            </div>
          </div>
          <div style="font-family: var(--font-mono); font-size: 11px; color: #0284c7; margin-top: 8px; word-break: break-all;">
            <strong>Vector:</strong> ${cvssResult.vectorString}
          </div>
        </div>

        <h4 style="font-size: 13.5px; font-weight: 700; color: #0f172a; margin: 12px 0 6px;">
          Tácticas y Técnicas MITRE ATT&CK® Enterprise
        </h4>
        <div class="table-container" style="margin-bottom: 16px;">
          <table>
            <thead>
              <tr>
                <th>ID Técnica</th>
                <th>Nombre Oficial</th>
                <th>Táctica</th>
                <th>Descripción en el Laboratorio</th>
              </tr>
            </thead>
            <tbody>
              ${frameworks.mitre
                .map(
                  (m) => `
                <tr>
                  <td><span class="port-tag" style="background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe;">${m.id}</span></td>
                  <td><strong>${m.name}</strong></td>
                  <td><span style="font-family: var(--font-mono); font-size: 11px; color: #475569;">${m.tactic} (${m.tacticId})</span></td>
                  <td style="font-size: 12px;">${m.description}</td>
                </tr>`
                )
                .join('')}
            </tbody>
          </table>
        </div>

        <h4 style="font-size: 13.5px; font-weight: 700; color: #0f172a; margin: 12px 0 6px;">
          Riesgos Críticos OWASP Top 10 (2021)
        </h4>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Código OWASP</th>
                <th>Categoría de Riesgo</th>
                <th>Impacto en el Escenario</th>
              </tr>
            </thead>
            <tbody>
              ${frameworks.owasp
                .map(
                  (o) => `
                <tr>
                  <td><span class="port-tag" style="background: #fffbeb; color: #b45309; border-color: #fde68a;">${o.code}</span></td>
                  <td><strong>${o.name}</strong></td>
                  <td style="font-size: 12px;">${o.description}</td>
                </tr>`
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </section>

      <!-- 6. Banderas Criptográficas (Flags) -->
      <section class="section">
        <div class="section-header">
          <span class="section-number">06</span>
          <h3 class="section-title">Especificación de Banderas Criptográficas (Flags)</h3>
        </div>
        <div class="flags-block">
          <div class="flag-card">
            <span class="flag-label">🚩 Bandera de Usuario (User Flag)</span>
            <span class="flag-value">${scenario.userFlag}</span>
            <span class="flag-path">Ruta en target: ${scenario.userFlagPath}</span>
          </div>
          <div class="flag-card">
            <span class="flag-label">🏆 Bandera de Administrador (Root Flag)</span>
            <span class="flag-value">${scenario.rootFlag}</span>
            <span class="flag-path">Ruta en target: ${scenario.rootFlagPath}</span>
          </div>
        </div>
      </section>

      <!-- 7. Sistema de Pistas Graduales -->
      <section class="section">
        <div class="section-header">
          <span class="section-number">07</span>
          <h3 class="section-title">Sistema de Pistas Graduales Anti-Spoilers</h3>
        </div>
        <p class="lead-text">
          Diseñadas pedagógicamente en 3 niveles escalonados para orientar al estudiante sin arruinar la experiencia:
        </p>
        <div class="hints-matrix">
          ${(scenario.hints || [])
            .map(
              (h) => `
            <div class="hint-row">
              <span class="hint-level level-${h.level}">Nivel ${h.level}</span>
              <div class="hint-content">
                <h6>${h.title} <small style="color: var(--text-muted); font-family: var(--font-mono);">[${h.category.toUpperCase()}]</small></h6>
                <p>${h.text}</p>
              </div>
            </div>`
            )
            .join('')}
        </div>
      </section>

      <!-- 8. Despliegue en 1 Clic con Docker -->
      <section class="section">
        <div class="section-header">
          <span class="section-number">08</span>
          <h3 class="section-title">Instrucciones de Despliegue Local (Docker Compose)</h3>
        </div>
        <p class="lead-text">
          Para aprovisionar y levantar el laboratorio en cualquier entorno compatible con Docker:
        </p>
        <pre><code># 1. Descomprimir el paquete del laboratorio
unzip lab_${(scenario.codename || 'ctf').toLowerCase()}_completo.zip
cd lab_${(scenario.codename || 'ctf').toLowerCase()}

# 2. Levantar el laboratorio en segundo plano
docker compose up --build -d

# 3. Comprobar servicios activos
docker compose ps

# 4. Probar conectividad con el contenedor
curl -i http://localhost:80/

# 5. Desmontar el laboratorio tras la sesión
docker compose down -v</code></pre>
      </section>

      <!-- 9. Solución Técnica (Walkthrough) -->
      <section class="section page-break">
        <div class="section-header">
          <span class="section-number">09</span>
          <h3 class="section-title">Guía de Explotación y Solución Técnica (Writeup)</h3>
        </div>
        <div class="writeup-container">
          ${formatMarkdownToHtml(scenario.walkthrough || 'Solución disponible en WRITEUP.md')}
        </div>
      </section>
    </main>

    <!-- Document Footer -->
    <footer class="doc-footer">
      <div class="footer-left">
        <strong>NetPhantom CTF</strong> · Desarrollado para la comunidad de 
        <a class="footer-link" href="https://www.unfantasmaenelsistema.com/" target="_blank" rel="noopener noreferrer">
          Un Fantasma En El Sistema
        </a>
      </div>
      <div>
        <span>Uso exclusivamente educativo · Hacking Ético</span>
      </div>
    </footer>
  </div>

</body>
</html>`;
}
