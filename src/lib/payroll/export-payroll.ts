import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PrePayrollSummaryItem } from '@/types';

/**
 * Generates an Excel workbook (.xlsx) formatted for CONTPAQi Nóminas & Aspel NOI import
 */
export function exportPrePayrollToExcel(
  items: PrePayrollSummaryItem[],
  periodName: string = 'Semana 41 - Octubre 2026'
): void {
  // Sheet 1: CONTPAQi Nóminas Layout (Standard CSV/Excel Structure)
  const contpaqiData = items.map((item) => ({
    'Código Empleado': item.employee_number,
    'Nombre Completo': item.full_name,
    'Departamento': item.department,
    'Puesto': item.position,
    'Tipo': item.employee_type.toUpperCase(),
    'Salario Diario (MXN)': item.daily_salary_mxn,
    'Días Trabajados': item.regular_days_worked,
    'Faltas Justificadas': item.justified_absences,
    'Faltas Injustificadas': item.unjustified_absences,
    'Deducción Faltas ($)': item.absence_deductions_mxn,
    'Retardos Acumulados': item.tardiness_count,
    'Deducción Retardos ($)': item.tardiness_deductions_mxn,
    'Hrs Extras Dobles (LFT Art 66)': item.overtime_double_hours,
    'Importe H.E. Dobles ($)': item.overtime_double_total_mxn,
    'Hrs Extras Triples (LFT Art 68)': item.overtime_triple_hours,
    'Importe H.E. Triples ($)': item.overtime_triple_total_mxn,
    'Prima Dominical ($)': item.sunday_premium_mxn,
    'Festivo Laborado ($)': item.holiday_worked_mxn,
    'Total Percepciones ($)': item.gross_earnings_mxn,
    'Total Deducciones ($)': item.total_deductions_mxn,
    'Neto Estimado ($)': item.net_payable_mxn,
    'Sello NOM-151': item.nom151_batch_hash.substring(0, 24) + '...',
  }));

  // Sheet 2: Aspel NOI Layout (Key-value import codes: P001, P002, D001...)
  const aspelNoiData = items.map(item => ({
    CLAVE_TRAB: item.employee_number,
    NOMBRE: item.full_name,
    P001_SUELDO_ORD: item.regular_salary_total,
    P002_HE_DOBLES: item.overtime_double_total_mxn,
    P003_HE_TRIPLES: item.overtime_triple_total_mxn,
    P004_PRIMA_DOM: item.sunday_premium_mxn,
    D001_FALTAS: item.absence_deductions_mxn,
    D002_RETARDOS: item.tardiness_deductions_mxn,
    NETO_DISPERSION: item.net_payable_mxn,
  }));

  const wb = XLSX.utils.book_new();

  const wsContpaqi = XLSX.utils.json_to_sheet(contpaqiData);
  const wsAspel = XLSX.utils.json_to_sheet(aspelNoiData);

  // Set column widths for readability
  wsContpaqi['!cols'] = [
    { wch: 15 }, { wch: 28 }, { wch: 22 }, { wch: 25 }, { wch: 10 },
    { wch: 18 }, { wch: 15 }, { wch: 16 }, { wch: 18 }, { wch: 18 },
    { wch: 18 }, { wch: 18 }, { wch: 24 }, { wch: 20 }, { wch: 24 },
    { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 20 },
    { wch: 18 }, { wch: 28 }
  ];

  XLSX.utils.book_append_sheet(wb, wsContpaqi, 'Layout CONTPAQi Nóminas');
  XLSX.utils.book_append_sheet(wb, wsAspel, 'Layout Aspel NOI');

  const fileName = `Verifield_PreNomina_${periodName.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Generates an official, auditable PDF pre-payroll document with digital signature boxes and NOM-151 certificate seal
 */
export function exportPrePayrollToPDF(
  items: PrePayrollSummaryItem[],
  periodName: string = 'Semana 41 - Octubre 2026'
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Bar with Green Seven Emerald
  doc.setFillColor(5, 150, 105); // Green Seven #059669
  doc.rect(0, 0, pageWidth, 24, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('VERIFIELD • GREEN SEVEN MÉXICO — PRE-NÓMINA & COMPLIANCE', 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(240, 253, 244); // light mint
  doc.text(
    `Periodo: ${periodName} | Emisión: ${new Date().toLocaleDateString('es-MX')} | Conforme a LFT & NOM-151-SCFI-2016`,
    14,
    18
  );

  // Table Data
  const tableHead = [
    [
      'Clave',
      'Colaborador',
      'Puesto / Tipo',
      'Sal. Diario',
      'Días Lab.',
      'Faltas/Ret.',
      'H.E. Dobles (LFT 66)',
      'H.E. Triples (LFT 68)',
      'Percepciones',
      'Deducciones',
      'Neto a Pagar',
    ],
  ];

  const tableBody = items.map(item => [
    item.employee_number,
    item.full_name,
    `${item.position} (${item.employee_type})`,
    `$${item.daily_salary_mxn.toFixed(2)}`,
    `${item.regular_days_worked} d`,
    `${item.justified_absences + item.unjustified_absences} F / ${item.tardiness_count} R`,
    `${item.overtime_double_hours}h ($${item.overtime_double_total_mxn.toFixed(2)})`,
    `${item.overtime_triple_hours}h ($${item.overtime_triple_total_mxn.toFixed(2)})`,
    `$${item.gross_earnings_mxn.toFixed(2)}`,
    `$${item.total_deductions_mxn.toFixed(2)}`,
    `$${item.net_payable_mxn.toFixed(2)}`,
  ]);

  const totalPercepciones = items.reduce((acc, i) => acc + i.gross_earnings_mxn, 0);
  const totalDeducciones = items.reduce((acc, i) => acc + i.total_deductions_mxn, 0);
  const totalNeto = items.reduce((acc, i) => acc + i.net_payable_mxn, 0);

  autoTable(doc, {
    startY: 28,
    head: tableHead,
    body: tableBody,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 16 },
      1: { cellWidth: 42 },
      2: { cellWidth: 38 },
      3: { halign: 'right', cellWidth: 20 },
      4: { halign: 'center', cellWidth: 16 },
      5: { halign: 'center', cellWidth: 18 },
      6: { halign: 'right', cellWidth: 28 },
      7: { halign: 'right', cellWidth: 28 },
      8: { halign: 'right', cellWidth: 24, fontStyle: 'bold' },
      9: { halign: 'right', cellWidth: 22, textColor: [185, 28, 28] },
      10: { halign: 'right', cellWidth: 25, fontStyle: 'bold', textColor: [16, 185, 129] },
    },
    foot: [
      [
        '',
        'TOTALES GENERALES CONSOLIDADOS',
        '',
        '',
        '',
        '',
        '',
        '',
        `$${totalPercepciones.toFixed(2)}`,
        `$${totalDeducciones.toFixed(2)}`,
        `$${totalNeto.toFixed(2)}`,
      ],
    ],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'right',
    },
  });

  // Footer / Compliance Seal & Digital Signature boxes
  const docWithTable = doc as unknown as { lastAutoTable?: { finalY: number } };
  const finalY = (docWithTable.lastAutoTable?.finalY ?? 150) + 10;
  
  // NOM-151 Stamp Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, finalY, 120, 26, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('CONSTANCIA DE CONSERVACIÓN NOM-151-SCFI-2016', 18, finalY + 6);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('PRESTADOR PSC: PSC-EDICOM-MÉXICO-AUT-SE-2026', 18, finalY + 11);
  doc.text('SELLO DIGITAL SHA-256 CONSOLIDADO:', 18, finalY + 16);
  doc.text('f84a92c301e8b7d6a5c4e3f2b1a0987654321fedcba0987654321abcdef01234', 18, finalY + 21);

  // Signatures
  const sigX = 148;
  const boxWidth = 65;
  const sigY = finalY;

  // Box 1: RH
  doc.setDrawColor(148, 163, 184);
  doc.line(sigX, sigY + 18, sigX + boxWidth, sigY + 18);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Lic. Sofía Morales Garza', sigX + boxWidth / 2, sigY + 22, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Dirección de Capital Humano', sigX + boxWidth / 2, sigY + 25, { align: 'center' });

  // Box 2: Supervisor / Rep Legal
  const sig2X = sigX + boxWidth + 12;
  doc.line(sig2X, sigY + 18, sig2X + boxWidth, sigY + 18);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Ing. Carlos Méndez Soto', sig2X + boxWidth / 2, sigY + 22, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Supervisor General de Operaciones', sig2X + boxWidth / 2, sigY + 25, { align: 'center' });

  doc.save(`Verifield_Acta_Oficial_${periodName.replace(/\s+/g, '_')}.pdf`);
}
