import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import config from '../config';

const API_BASE_URL = config.API_URL.replace(/\/api\/?$/, '');

export const formatGuiaPdfDate = (value) => {
  if (!value) return 'No registrada';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

export const buildGuiaPdfData = (guia = {}, estudiantes = []) => {
  const metadataRows = [
    ['Código', guia.Codigo || 'Sin código'],
    ['Tema', guia.Tema || 'Sin tema'],
    ['Materia', guia.Materia || 'Sin materia'],
    ['Docente', guia.Docente || 'Sin docente'],
    ['Complejidad', guia.Complejidad || 'Sin complejidad'],
    ['Fecha de diseño', formatGuiaPdfDate(guia.FechaDiseno)],
    ['Fecha de validación', formatGuiaPdfDate(guia.FechaValidacion)]
  ];

  const studentRows = (Array.isArray(estudiantes) ? estudiantes : []).map((estudiante) => [
    estudiante.ApellidosNombres || 'Sin nombre',
    estudiante.Observacion || 'Sin observación'
  ]);

  const sections = [
    { title: 'Tema del caso', content: guia.TemaCaso || 'No registrado' },
    { title: 'Técnicas / Procedimientos', content: guia.TecnicasProcedimientos || 'No registrado' },
    { title: 'Contexto clínico del escenario', content: guia.ContextoClinicoEscenario || 'No registrado' },
    { title: 'Conocimientos previos', content: guia.ConocimientosPrevios || 'No registrado' },
    { title: 'Objetivos de aprendizaje', content: guia.ObjetivosAprendizaje || 'No registrado' },
    { title: 'Resultados de aprendizaje', content: guia.ResultadosAprendizaje || 'No registrado' },
    { title: 'Descripción del ambiente de aprendizaje', content: guia.DescripcionAmbienteAprendizaje || 'No registrado' },
    { title: 'Material y equipos médicos', content: guia.MaterialEquiposMedicos || 'No registrado' },
    { title: 'Características del actor', content: guia.CaracteristicasActor || 'No registrado' },
    { title: 'Descripción de escena', content: guia.DescripcionEscena || 'No registrado' },
    { title: 'Libreto', content: guia.Libreto || 'No registrado' },
    { title: 'Referencias bibliográficas', content: guia.ReferenciasBibliograficas || 'No registrado' }
  ];

  return { metadataRows, sections, studentRows };
};

const loadImageAsDataUrl = async (imagePath) => {
  const response = await fetch(imagePath);
  if (!response.ok) {
    throw new Error(`No se pudo cargar la imagen ${imagePath}`);
  }

  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const getGuiaFotoUrl = (ruta = '') => {
  if (!ruta) return '';
  if (/^(https?:|data:|blob:)/i.test(ruta)) return ruta;
  return `${API_BASE_URL}/${String(ruta).replace(/^\/+/, '')}`;
};

const getImageDimensions = (dataUrl) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
  image.onerror = reject;
  image.src = dataUrl;
});

const loadSolicitudFoto = async (foto) => {
  const dataUrl = await loadImageAsDataUrl(getGuiaFotoUrl(foto.Ruta));
  const dimensions = await getImageDimensions(dataUrl);
  return { ...foto, dataUrl, ...dimensions };
};

const addSolicitudFotos = async (doc, fotos, options) => {
  if (!Array.isArray(fotos) || fotos.length === 0) return null;

  const { margin, pageWidth, pageHeight, headerColor, accentColor, startY } = options;
  const loadedFotos = (await Promise.all(fotos.map(async (foto) => {
    try {
      return await loadSolicitudFoto(foto);
    } catch (error) {
      console.error(`No se pudo agregar la foto ${foto.NombreOriginal || foto.Ruta}:`, error);
      return null;
    }
  }))).filter(Boolean);

  if (loadedFotos.length === 0) return null;

  const columns = 2;
  const columnGap = 6;
  const rowGap = 6;
  const cellWidth = (pageWidth - margin * 2 - columnGap) / columns;
  const cellHeight = 72;
  const imagePadding = 3;
  const captionHeight = 12;
  let rowY = startY;

  if (rowY + 12 + cellHeight > pageHeight - margin) {
    doc.addPage();
    rowY = margin;
  }

  doc.setTextColor(...headerColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Registro fotográfico de la solicitud', margin, rowY);
  doc.setDrawColor(...accentColor);
  doc.setLineWidth(0.5);
  doc.line(margin, rowY + 4, pageWidth - margin, rowY + 4);
  rowY += 9;

  loadedFotos.forEach((foto, index) => {
    const column = index % columns;

    if (column === 0 && rowY + cellHeight > pageHeight - margin) {
      doc.addPage();
      doc.setTextColor(...headerColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Registro fotográfico (continuación)', margin, margin);
      rowY = margin + 5;
    }

    const cellX = margin + column * (cellWidth + columnGap);
    const cellY = rowY;
    const maxWidth = cellWidth - imagePadding * 2;
    const maxHeight = cellHeight - captionHeight - imagePadding * 2;
    const scale = Math.min(maxWidth / foto.width, maxHeight / foto.height);
    const imageWidth = foto.width * scale;
    const imageHeight = foto.height * scale;
    const imageX = cellX + (cellWidth - imageWidth) / 2;
    const imageY = cellY + imagePadding + (maxHeight - imageHeight) / 2;

    doc.setDrawColor(205, 213, 223);
    doc.setLineWidth(0.3);
    doc.roundedRect(cellX, cellY, cellWidth, cellHeight, 1.5, 1.5);

    doc.addImage(foto.dataUrl, imageX, imageY, imageWidth, imageHeight);

    const caption = foto.Descripcion || foto.NombreOriginal || 'Sin descripción';
    const captionLines = doc.splitTextToSize(String(caption), maxWidth).slice(0, 2);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(60, 60, 60);
    doc.text(captionLines, cellX + imagePadding, cellY + cellHeight - captionHeight + 4);

    if (column === columns - 1 || index === loadedFotos.length - 1) {
      rowY += cellHeight + rowGap;
    }
  });

  return rowY - rowGap;
};

export const createGuiaPdf = async (guia = {}, estudiantes = [], fotos = []) => {
  const { metadataRows, sections, studentRows } = buildGuiaPdfData(guia, estudiantes);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const headerColor = [18, 68, 121];
  const accentColor = [0, 120, 190];
  const printedAt = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  doc.setFillColor(...headerColor);
  doc.rect(0, 0, pageWidth, 44, 'F');

  const [hospitalLogo, itsupLogo] = await Promise.all([
    loadImageAsDataUrl('/logo_hospital.png'),
    loadImageAsDataUrl('/logo_itsup.png')
  ]);

  doc.addImage(hospitalLogo, 'PNG', margin, 8, 24, 24);
  doc.addImage(itsupLogo, 'PNG', pageWidth - margin - 24, 8, 24, 24);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Guía de Simulación Clínica', pageWidth / 2, 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Departamento de Simulación y Docencia', pageWidth / 2, 24, { align: 'center' });
  doc.text('Documento formal para uso académico y clínico', pageWidth / 2, 30, { align: 'center' });

  doc.setDrawColor(...accentColor);
  doc.setLineWidth(0.5);
  doc.line(margin, 48, pageWidth - margin, 48);

  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Datos generales de la guía', margin, 56);

  autoTable(doc, {
    startY: 60,
    head: [['Campo', 'Detalle']],
    body: metadataRows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 1.8,
      textColor: [40, 40, 40]
    },
    headStyles: {
      fillColor: headerColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 45, fontStyle: 'bold' },
      1: { cellWidth: pageWidth - margin * 2 - 45 }
    },
    alternateRowStyles: {
      fillColor: [245, 248, 252]
    }
  });

  const finalY = doc.lastAutoTable.finalY + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Contenido de la guía', margin, finalY);

  autoTable(doc, {
    startY: finalY + 5,
    head: [['Sección', 'Contenido']],
    body: sections.map(({ title, content }) => [title, String(content)]),
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      overflow: 'linebreak',
      textColor: [40, 40, 40]
    },
    headStyles: {
      fillColor: accentColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold' },
      1: { cellWidth: pageWidth - margin * 2 - 55 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    pageBreak: 'auto'
  });

  const studentTableY = doc.lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Lista de estudiantes de la solicitud', margin, studentTableY);

  autoTable(doc, {
    startY: studentTableY + 4,
    head: [['Estudiante', 'Observación']],
    body: studentRows.length > 0 ? studentRows : [['No se registraron estudiantes para esta solicitud', '']],
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      overflow: 'linebreak',
      textColor: [40, 40, 40]
    },
    headStyles: {
      fillColor: accentColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: 'bold' },
      1: { cellWidth: pageWidth - margin * 2 - 70 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    pageBreak: 'auto'
  });

  const photoFinalY = await addSolicitudFotos(doc, fotos, {
    margin,
    pageWidth,
    pageHeight,
    headerColor,
    accentColor,
    startY: doc.lastAutoTable.finalY + 10
  });
  const signatureStartY = photoFinalY === null ? doc.lastAutoTable.finalY + 18 : photoFinalY + 18;
  let signY = signatureStartY;
  const footerY = pageHeight - 18;

  if (signY + 24 > footerY - 4) {
    doc.addPage();
    signY = margin;
  }

  const signatureWidth = 55;
  const leftX = margin + signatureWidth / 2;
  const centerX = pageWidth / 2;
  const rightX = pageWidth - margin - signatureWidth / 2;
  const signatureLineY = signY;
  const nameY = signY + 6;
  const titleY = signY + 10;

  doc.setDrawColor(...accentColor);
  doc.setLineWidth(0.4);
  doc.line(leftX - signatureWidth / 2, signatureLineY, leftX + signatureWidth / 2, signatureLineY);
  doc.line(centerX - signatureWidth / 2, signatureLineY, centerX + signatureWidth / 2, signatureLineY);
  doc.line(rightX - signatureWidth / 2, signatureLineY, rightX + signatureWidth / 2, signatureLineY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text(guia.Docente || 'Nombre del docente', leftX, nameY, { align: 'center' });
  doc.text('Ing. Silvia Pico', centerX, nameY, { align: 'center' });
  doc.text('Lic. Anthony Cobeña', rightX, nameY, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.text('DOCENTE', leftX, titleY, { align: 'center' });
  doc.text('VICERRECTORA ACADÉMICA', centerX, titleY, { align: 'center' });
  doc.text('ADMINISTRADOR H.S.', rightX, titleY, { align: 'center' });

  doc.setDrawColor(...accentColor);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(`Documento generado el ${printedAt}`, margin, footerY);

  const fileName = `guia-${guia.Codigo || guia.ID || 'sin-codigo'}.pdf`;
  doc.save(fileName);
};
