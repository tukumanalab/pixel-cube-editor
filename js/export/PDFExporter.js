// PDFExporter.js - Export faces as PDF document

// jsPDF is loaded globally via script tag in index.html
const { jsPDF } = window.jspdf || window;

export class PDFExporter {
  constructor(editorState) {
    this.editorState = editorState;
  }

  // Export all faces as a PDF document
  exportPDF(include3DPreview = false, previewDataURL = null) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Title
    doc.setFontSize(20);
    doc.text('Pixel Cube Design', pageWidth / 2, 20, { align: 'center' });

    // 6 faces in 2x3 grid layout
    const faces = ['top', 'front', 'bottom', 'back', 'left', 'right'];
    const faceLabels = ['Top', 'Front', 'Bottom', 'Back', 'Left', 'Right'];
    const imgSize = 60; // mm
    const margin = 15;
    const startX = 30;
    let startY = 35;

    // If including 3D preview, add it at the top
    if (include3DPreview && previewDataURL) {
      doc.setFontSize(14);
      doc.text('3D Preview', pageWidth / 2, startY, { align: 'center' });
      startY += 10;

      const previewSize = 80;
      const previewX = (pageWidth - previewSize) / 2;
      doc.addImage(previewDataURL, 'PNG', previewX, startY, previewSize, previewSize);
      startY += previewSize + 15;
    }

    // Draw each face with label
    faces.forEach((face, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = startX + col * (imgSize + margin);
      const y = startY + row * (imgSize + margin + 10);

      // Face label
      doc.setFontSize(12);
      doc.text(faceLabels[index], x + imgSize / 2, y - 5, { align: 'center' });

      // Create canvas for this face and convert to image
      const canvas = this.createFaceCanvas(face);
      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', x, y, imgSize, imgSize);

      // Draw border around image
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.rect(x, y, imgSize, imgSize);
    });

    // Footer with export date
    doc.setFontSize(8);
    doc.setTextColor(150);
    const exportDate = new Date().toLocaleString('ja-JP');
    doc.text(`Exported: ${exportDate}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Save the PDF
    doc.save('pixel-cube-design.pdf');
  }

  // Helper: Create canvas from face data
  createFaceCanvas(faceName) {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');

    const faceData = this.editorState.faces[faceName];
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        ctx.fillStyle = faceData[y][x];
        ctx.fillRect(x, y, 1, 1);
      }
    }

    return canvas;
  }
}
