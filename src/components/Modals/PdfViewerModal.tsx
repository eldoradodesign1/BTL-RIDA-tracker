import React, { useEffect, useState } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  ExternalLink, 
  FileText, 
  CheckCircle2, 
  Smartphone 
} from 'lucide-react';
import { 
  buildAgentReportHtml, 
  buildSupervisorReportHtml, 
  buildAdminBatchReportHtml, 
  generateAgentPDF, 
  generateSupervisorPDF, 
  generateAdminBatchPDF 
} from '../../utils/pdfGenerator';
import { getReports } from '../../utils/storage';

interface PdfViewerModalProps {
  isOpen: boolean;
  pdfUrl: string | null;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ isOpen, pdfUrl, onClose }) => {
  const [reportData, setReportData] = useState<any>(null);
  const [supervisorData, setSupervisorData] = useState<any>(null);
  const [batchData, setBatchData] = useState<any>(null);
  const [htmlDoc, setHtmlDoc] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false);

  useEffect(() => {
    let activeBlob: string | null = null;
    setFallbackMode(false);
    setReportData(null);
    setSupervisorData(null);
    setBatchData(null);
    setHtmlDoc(null);

    if (!pdfUrl) {
      setBlobUrl(null);
      return;
    }

    if (pdfUrl.startsWith('preview-supervisor:')) {
      try {
        const raw = JSON.parse(decodeURIComponent(pdfUrl.replace('preview-supervisor:', '')));
        setSupervisorData(raw);
        setHtmlDoc(buildSupervisorReportHtml(raw));
      } catch {
        setHtmlDoc(null);
      }
      setBlobUrl(null);
      return;
    }

    if (pdfUrl.startsWith('preview-admin-batch:')) {
      try {
        const raw = JSON.parse(decodeURIComponent(pdfUrl.replace('preview-admin-batch:', '')));
        setBatchData(raw);
        setHtmlDoc(buildAdminBatchReportHtml(raw));
      } catch {
        setHtmlDoc(null);
      }
      setBlobUrl(null);
      return;
    }

    if (pdfUrl.startsWith('report-id:')) {
      const repId = pdfUrl.replace('report-id:', '').trim();
      const rep = getReports().find((r) => r.id === repId) || null;
      setReportData(rep);
      if (rep) {
        setHtmlDoc(buildAgentReportHtml(rep as any));
      }
      setBlobUrl(null);
      return;
    }

    if (pdfUrl.startsWith('data:application/pdf;base64,')) {
      try {
        const b64 = pdfUrl.split(',')[1];
        const binary = window.atob(b64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        activeBlob = URL.createObjectURL(blob);
        setBlobUrl(activeBlob);
      } catch {
        setBlobUrl(pdfUrl);
      }
    } else {
      setBlobUrl(pdfUrl);
    }

    return () => {
      if (activeBlob) {
        URL.revokeObjectURL(activeBlob);
      }
    };
  }, [pdfUrl]);

  if (!isOpen || !pdfUrl) return null;

  const handleDownload = async () => {
    try {
      if (supervisorData) {
        const uri = await generateSupervisorPDF(supervisorData);
        const a = document.createElement('a');
        a.href = uri;
        a.download = `Rapport_Supervision_RIDA_${supervisorData.date || 'date'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
      if (batchData) {
        const uri = await generateAdminBatchPDF(batchData);
        const a = document.createElement('a');
        a.href = uri;
        a.download = `Compilation_RIDA_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
      if (reportData) {
        const uri = await generateAgentPDF(reportData);
        const a = document.createElement('a');
        a.href = uri;
        a.download = `Rapport_RIDA_${reportData.agent_name || 'Agent'}_${reportData.date || 'date'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
      if (blobUrl) {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `Rapport_RIDA_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (e) {
      console.error('Download error:', e);
    }
  };

  const handlePrint = async () => {
    try {
      if (supervisorData) {
        const uri = await generateSupervisorPDF(supervisorData);
        const w = window.open(uri, '_blank');
        w?.focus();
        w?.print();
        return;
      }
      if (batchData) {
        const uri = await generateAdminBatchPDF(batchData);
        const w = window.open(uri, '_blank');
        w?.focus();
        w?.print();
        return;
      }
      if (reportData) {
        const uri = await generateAgentPDF(reportData);
        const w = window.open(uri, '_blank');
        w?.focus();
        w?.print();
        return;
      }
      if (blobUrl) {
        const w = window.open(blobUrl, '_blank');
        w?.focus();
        w?.print();
      }
    } catch (e) {
      console.error('Print error:', e);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-2 sm:p-6 animate-pop"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl h-[92vh] bg-zinc-950 border border-emerald-500/30 rounded-3xl overflow-hidden flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="px-6 py-4 bg-zinc-900 border-b border-emerald-500/20 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00D084] animate-ping" />
            <span className="text-xs font-black uppercase tracking-wider text-[#00D084]">
              Rapport Officiel RIDA Lubumbashi
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 bg-gradient-to-r from-[#00D084] to-[#059669] hover:from-[#10B981] hover:to-[#047857] text-[#032313] rounded-xl text-xs font-black uppercase flex items-center space-x-1.5 transition shadow-[0_4px_15px_rgba(0,208,132,0.3)]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition"
              title="Imprimer"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="flex-1 bg-zinc-900 relative overflow-hidden flex flex-col">
          {htmlDoc ? (
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-zinc-100">
              <iframe
                title="Aperçu Rapport RIDA"
                srcDoc={htmlDoc}
                className="w-full h-full min-h-[70vh] rounded-2xl border border-zinc-200 bg-white"
                sandbox="allow-same-origin allow-popups"
              />
            </div>
          ) : blobUrl ? (
            <div className="w-full h-full relative bg-zinc-800">
              <iframe
                src={blobUrl}
                className="w-full h-full"
                title="Aperçu Document PDF"
              />
            </div>
          ) : (
            <div className="flex-1 p-8 overflow-y-auto bg-white text-zinc-900 flex items-center justify-center">
              <div className="text-center max-w-md">
                <FileText className="w-14 h-14 text-emerald-600 mx-auto mb-3" />
                <h3 className="text-lg font-black text-zinc-900 uppercase">Document RIDA Généré</h3>
                <p className="text-xs text-zinc-600 mt-1 mb-4">
                  Cliquez sur "Télécharger PDF" ci-dessus pour obtenir la version complète.
                </p>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase"
                >
                  Télécharger le PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
