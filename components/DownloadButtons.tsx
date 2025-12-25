'use client';

import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface DownloadButtonsProps {
  cardRef: React.RefObject<HTMLDivElement>;
  username: string;
}

export default function DownloadButtons({ cardRef, username }: DownloadButtonsProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadPNG = async () => {
    if (!cardRef.current) return;

    setIsDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0d1117',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `github-year-review-${username}-2024.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error generating PNG:', error);
      alert('Failed to generate PNG. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadPDF = async () => {
    if (!cardRef.current) return;

    setIsDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0d1117',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`github-year-review-${username}-2024.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex gap-4">
      <button
        onClick={downloadPNG}
        disabled={isDownloading}
        className="px-6 py-3 bg-github-gray hover:bg-[#1f2329] border border-github-border rounded-lg text-github-text font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDownloading ? 'Generating...' : 'Download PNG'}
      </button>
      <button
        onClick={downloadPDF}
        disabled={isDownloading}
        className="px-6 py-3 bg-github-gray hover:bg-[#1f2329] border border-github-border rounded-lg text-github-text font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDownloading ? 'Generating...' : 'Download PDF'}
      </button>
    </div>
  );
}

