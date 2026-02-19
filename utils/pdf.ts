import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PDFReportOptions {
    title: string;
    subtitle?: string;
    columns: string[];
    data: (string | number)[][];
    filename?: string;
    action?: 'save' | 'print';
}

export const generateReportPDF = ({ title, subtitle, columns, data, filename, action = 'save' }: PDFReportOptions) => {
    const doc = new jsPDF();

    // --- Header ---
    // Brand Name
    doc.setFontSize(24);
    doc.setTextColor(30, 41, 59); // Slate 800
    doc.setFont('helvetica', 'bold');
    doc.text("GTA Distributor", 14, 20);

    // Brand Subtitle
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.setFont('helvetica', 'normal');
    doc.text("Distributor Aspal Cair", 14, 26);

    // Example Company Address (can be dynamic if needed)
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text("Jl.Kp.Cirumput RT/RW 001/002, Cileungsi, Bogor", 196, 20, { align: 'right' });
    doc.text("aspalinfo@gmail.com | +62 895-1725-9583", 196, 25, { align: 'right' });

    // Accent Line
    doc.setDrawColor(99, 102, 241); // Indigo 500
    doc.setLineWidth(1);
    doc.line(14, 32, 196, 32);

    // --- Report Title & Meta ---
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 45);

    if (subtitle) {
        doc.setFontSize(11);
        doc.setTextColor(100, 116, 139); // Slate 500
        doc.setFont('helvetica', 'normal');
        doc.text(subtitle, 14, 52);
    }

    const generatedDate = new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(`Generated on: ${generatedDate}`, 196, 45, { align: 'right' });

    // --- Table ---
    autoTable(doc, {
        head: [columns],
        body: data,
        startY: subtitle ? 60 : 55,
        theme: 'grid',
        styles: {
            fontSize: 9,
            cellPadding: 4,
            textColor: [51, 65, 85], // Slate 700
            lineColor: [226, 232, 240], // Slate 200
            lineWidth: 0.1,
        },
        headStyles: {
            fillColor: [15, 23, 42], // Slate 900
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            0: { fontStyle: 'bold' } // First column bold
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252] // Slate 50
        },
        footStyles: {
            fillColor: [241, 245, 249],
            textColor: [30, 41, 59],
            fontStyle: 'bold'
        },
        didDrawPage: (data) => {
            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            const pageSize = doc.internal.pageSize;
            const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();

            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184); // Slate 400

            const footerText = `Page ${data.pageNumber} of ${pageCount}`;
            doc.text(footerText, pageSize.width - 20, pageHeight - 10, { align: 'right' });

            doc.text('Confidential - Internal Use Only', 14, pageHeight - 10);
        }
    });

    if (action === 'print') {
        doc.autoPrint();
        window.open(doc.output('bloburl'), '_blank');
    } else {
        const safeFilename = filename || title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        doc.save(`${safeFilename}_${new Date().toISOString().split('T')[0]}.pdf`);
    }
};
