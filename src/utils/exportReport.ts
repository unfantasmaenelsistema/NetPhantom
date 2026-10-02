import { CTFScenario } from '../types';
import { generateHtmlReport } from './generateHtmlReport';

/**
 * Downloads the scenario dossier as a standalone, beautifully styled HTML file.
 */
export function exportScenarioAsHtml(scenario: CTFScenario): void {
  const htmlContent = generateHtmlReport(scenario);
  const codeLower = (scenario.codename || 'ctf').toLowerCase();
  const filename = `Dossier_CTF_${codeLower}.html`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Opens a clean print dialogue (allowing "Save as PDF" / "Guardar como PDF")
 * rendered with complete professional typography, styling and page breaks.
 */
export function printScenarioAsPdf(scenario: CTFScenario): void {
  const htmlContent = generateHtmlReport(scenario);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Allow Google Fonts and styles to load before triggering print
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error('Print trigger failed:', e);
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }
    }, 400);
  }
}
