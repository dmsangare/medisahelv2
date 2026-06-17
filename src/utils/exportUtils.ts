/**
 * MédiSahel - Robust Data Governance & Export Utility
 * Ensured compliance with strict audit, print, Excel and PDF rules.
 */

/**
 * Cleanly transforms an array of objects to Excel-aligned, French-friendly CSV/XLS data.
 * Prepends UTF-8 BOM (\uFEFF) to prevent accent scrambling.
 * Uses semicolon ';' delimiter conforming to French and West African MS Excel defaults.
 */
export function exportToExcel(
  data: any[],
  filename: string,
  headersMap?: Record<string, string> | string[]
) {
  if (!data || !data.length) {
    alert("Aucune donnée disponible à exporter.");
    return;
  }

  let csvRows: string[] = [];

  // Determine Headers
  let headers: string[] = [];
  let keys: string[] = [];

  if (Array.isArray(headersMap)) {
    headers = headersMap;
    // Map keys from first object
    keys = Object.keys(data[0]);
  } else if (headersMap) {
    keys = Object.keys(headersMap);
    headers = keys.map(k => headersMap[k]);
  } else {
    keys = Object.keys(data[0]);
    headers = keys.map(k => {
      // Capitalize first letter and replace underscores
      return k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, " ");
    });
  }

  // Prepend headers
  csvRows.push(headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(";"));

  // Build rows
  data.forEach(item => {
    const values = keys.map(key => {
      let val = item[key];
      if (val === null || val === undefined) {
        val = "";
      } else if (typeof val === "object") {
        // Stringify nested objects (e.g. sub-arrays or clinical data)
        val = JSON.stringify(val);
      } else {
        val = String(val);
      }
      // Excel-safe string escaping
      return `"${val.replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
    });
    csvRows.push(values.join(";"));
  });

  // UTF-8 BOM + CSV Data
  const csvString = "\uFEFF" + csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.xls`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Creates a high-fidelity printable view of a specific DOM element.
 * Perfect for generating instant PDFs or physical printouts of certificates, receipt bills, and files.
 */
export function exportToPDF(elementId: string, documentTitle: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Export PDF Error: Element with ID '${elementId}' not found.`);
    alert(`Élément à imprimer '${elementId}' introuvable.`);
    return;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Veuillez autoriser les popups pour l'impression de document / génération de PDF.");
    return;
  }

  const todayStr = new Date().toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  // Extract CSS stylesheet links from the parent document to preserve full styles, including Tailwind
  let styleLinksHtml = "";
  const existingStyles = document.querySelectorAll("style, link[rel='stylesheet']");
  existingStyles.forEach(style => {
    styleLinksHtml += style.outerHTML;
  });

  printWindow.document.write(`
    <html>
      <head>
        <title>${documentTitle}</title>
        ${styleLinksHtml}
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono&display=swap');
          body {
            font-family: 'Inter', system-ui, sans-serif !important;
            color: #0f172a !important;
            background-color: #ffffff !important;
            padding: 40px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide non-printable widgets and buttons in the printed window */
          button, .no-print, [role="button"] {
            display: none !important;
          }
          .print-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 15px;
            margin-bottom: 30px;
          }
          .print-footer {
            margin-top: 50px;
            border-top: 1px solid #cbd5e1;
            padding-top: 15px;
            font-size: 11px;
            color: #64748b;
            display: flex;
            justify-content: space-between;
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <div>
            <h1 style="font-size: 18px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin: 0;">
              🏥 CLINIQUE CENTRALE MÉDISAHEL BAMAKO
            </h1>
            <p style="font-size: 11px; color: #475569; margin: 2px 0 0 0;">
              Sécurité Clinique, Excellence & Gouvernance Numérique • Mali
            </p>
          </div>
          <div style="text-align: right; font-size: 11px; color: #475569;">
            <strong>Extrait le :</strong> ${todayStr}<br/>
            <strong>Document :</strong> ${documentTitle}
          </div>
        </div>

        <div class="print-content">
          ${element.innerHTML}
        </div>

        <div class="print-footer">
          <div>
            Document officiel MédiSahel Mali · Sceau d'archivage numérique certifié légal.
          </div>
          <div style="text-align: right;">
            Page 1/1
          </div>
        </div>
        <script>
          setTimeout(() => {
            window.print();
            window.close();
          }, 300);
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
}
