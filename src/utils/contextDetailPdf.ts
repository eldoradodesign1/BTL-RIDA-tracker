import jsPDF from 'jspdf';

export interface DetailPdfRow {
  label: string;
  value?: string | number | null;
}

export interface DetailPdfSection {
  title: string;
  rows?: DetailPdfRow[];
  text?: string;
}

export interface DetailPdfDocument {
  title: string;
  subtitle?: string;
  filename: string;
  sections: DetailPdfSection[];
}

export async function exportContextDetailPdf(docData: DetailPdfDocument): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Background header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 38, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(docData.title, 14, 18);

  // Subtitle
  if (docData.subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(52, 211, 153); // emerald-400
    doc.text(docData.subtitle, 14, 28);
  }

  let y = 48;

  docData.sections.forEach((section) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    // Section title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(section.title, 14, y);
    y += 4;

    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(14, y, 196, y);
    y += 6;

    if (section.text) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const splitText = doc.splitTextToSize(section.text, 180);
      doc.text(splitText, 14, y);
      y += splitText.length * 5 + 4;
    }

    if (section.rows && section.rows.length > 0) {
      doc.setFontSize(9);
      section.rows.forEach((row) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text(row.label, 14, y);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        const val = row.value != null ? String(row.value) : '—';
        doc.text(val, 70, y);

        y += 6;
      });
      y += 4;
    }
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Généré via Vodacom BTL Manager - Page ${i}/${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }

  doc.save(`${docData.filename || 'export'}.pdf`);
}
