import { Injectable } from '@nestjs/common';
import { AssessmentGradeType, ReportCardStatus } from '@prisma/client';
import PDFDocument from 'pdfkit';

/** Identidade da escola usada no cabeçalho do boletim. */
const ESCOLA = {
  nome: 'BetterYou Kids',
  morada: 'Av. Comandante Gika 150, Sagrada Família, Luanda',
  telefones: '+244 921 669 893 / 943 400 537',
  email: 'escola@betteryoukids.com',
} as const;

const STATUS_LABEL: Record<ReportCardStatus, string> = {
  RASCUNHO: 'Rascunho',
  PUBLICADO: 'Publicado',
};

type ReportCardPdfInput = {
  id: string;
  status: ReportCardStatus;
  overallComment: string | null;
  publishedAt: Date | null;
  student: {
    childFullName: string;
    guardianFullName?: string | null;
    unit?: { name: string } | null;
    service?: { name: string } | null;
    room?: { name: string } | null;
    academicYear?: { label: string } | null;
  };
  period: {
    name: string;
    startDate: Date;
    endDate: Date;
    academicYear?: { label: string } | null;
    unit?: { name: string } | null;
  };
  classGroup: {
    name: string;
    room?: {
      name: string;
      unit?: { name: string } | null;
      service?: { name: string } | null;
    } | null;
    academicYear?: { label: string } | null;
  };
  author?: { name: string } | null;
  lines: Array<{
    subject: string;
    title: string;
    gradeType: AssessmentGradeType | null;
    gradeValue: number | null;
    gradeLabel: string | null;
    comment: string | null;
    sourceType: string;
  }>;
};

function formatDate(value: Date | null | undefined): string {
  if (!value) return '—';
  const d = value.getUTCDate().toString().padStart(2, '0');
  const m = (value.getUTCMonth() + 1).toString().padStart(2, '0');
  const y = value.getUTCFullYear();
  return `${d}/${m}/${y}`;
}

function safeFilenamePart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function formatGrade(line: ReportCardPdfInput['lines'][number]): string {
  if (line.gradeType === AssessmentGradeType.NUMERICA) {
    return line.gradeValue != null ? String(line.gradeValue) : '—';
  }
  if (line.gradeLabel?.trim()) return line.gradeLabel.trim();
  if (line.sourceType === 'SINTESE') return 'Síntese';
  return '—';
}

@Injectable()
export class BoletimPdfService {
  async generate(card: ReportCardPdfInput): Promise<{
    buffer: Buffer;
    filename: string;
  }> {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    const unitName =
      card.period.unit?.name ||
      card.classGroup.room?.unit?.name ||
      card.student.unit?.name ||
      '—';
    const serviceName =
      card.classGroup.room?.service?.name || card.student.service?.name || null;
    const yearLabel =
      card.period.academicYear?.label ||
      card.classGroup.academicYear?.label ||
      card.student.academicYear?.label ||
      '—';
    const roomName = card.classGroup.room?.name || card.student.room?.name;

    // Cabeçalho.
    doc.fontSize(20).fillColor('#1f2937').text(ESCOLA.nome, { align: 'left' });
    doc
      .fontSize(9)
      .fillColor('#4b5563')
      .text(ESCOLA.morada)
      .text(`Tel./WhatsApp: ${ESCOLA.telefones}`)
      .text(`Email: ${ESCOLA.email}`);
    doc.moveDown(0.5);
    doc
      .strokeColor('#e5e7eb')
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke();
    doc.moveDown(1);

    doc
      .fontSize(16)
      .fillColor('#111827')
      .text('BOLETIM DE AVALIAÇÃO', { align: 'center' });
    doc
      .fontSize(10)
      .fillColor('#6b7280')
      .text(card.period.name, { align: 'center' });
    doc.moveDown(1);

    const label = (text: string) =>
      doc.fontSize(10).fillColor('#6b7280').text(text, { continued: true });
    const value = (text: string) =>
      doc.fontSize(10).fillColor('#111827').text(` ${text}`);

    label('Aluno:');
    value(card.student.childFullName);
    if (card.student.guardianFullName) {
      label('Encarregado de educação:');
      value(card.student.guardianFullName);
    }
    label('Unidade:');
    value(unitName);
    if (serviceName) {
      label('Serviço:');
      value(serviceName);
    }
    label('Turma:');
    value(card.classGroup.name);
    if (roomName) {
      label('Sala:');
      value(roomName);
    }
    label('Ano lectivo:');
    value(yearLabel);
    label('Período:');
    value(
      `${card.period.name} (${formatDate(card.period.startDate)} — ${formatDate(card.period.endDate)})`,
    );
    label('Estado:');
    value(STATUS_LABEL[card.status]);
    if (card.publishedAt) {
      label('Data de publicação:');
      value(formatDate(card.publishedAt));
    }
    if (card.author?.name) {
      label('Emitido por:');
      value(card.author.name);
    }
    doc.moveDown(1);

    // Tabela de avaliações.
    doc
      .fontSize(11)
      .fillColor('#111827')
      .text('Avaliações e sínteses', { underline: true });
    doc.moveDown(0.5);

    if (card.lines.length === 0) {
      doc
        .fontSize(10)
        .fillColor('#6b7280')
        .text('Sem linhas de avaliação registadas neste período.');
    } else {
      const colSubject = 50;
      const colGrade = 400;
      const colEnd = 545;
      const headerY = doc.y;

      doc
        .fontSize(9)
        .fillColor('#374151')
        .text('Disciplina / Área', colSubject, headerY, { width: 320 })
        .text('Classificação', colGrade, headerY, { width: 145, align: 'right' });
      doc
        .strokeColor('#d1d5db')
        .moveTo(colSubject, headerY + 14)
        .lineTo(colEnd, headerY + 14)
        .stroke();
      doc.y = headerY + 20;

      for (const line of card.lines) {
        const rowTop = doc.y;
        const gradeText = formatGrade(line);
        doc
          .fontSize(10)
          .fillColor('#111827')
          .text(`${line.subject} — ${line.title}`, colSubject, rowTop, {
            width: 330,
          });
        const afterTitleY = doc.y;
        doc
          .fontSize(10)
          .fillColor('#065f46')
          .text(gradeText, colGrade, rowTop, { width: 145, align: 'right' });

        let contentBottom = Math.max(afterTitleY, rowTop + 12);
        if (line.comment?.trim()) {
          doc
            .fontSize(9)
            .fillColor('#4b5563')
            .text(line.comment.trim(), colSubject, contentBottom + 2, {
              width: 495,
            });
          contentBottom = doc.y;
        }

        doc.y = contentBottom + 8;
        if (doc.y > 720) {
          doc.addPage();
        }
      }
    }

    if (card.overallComment?.trim()) {
      doc.moveDown(1);
      doc
        .fontSize(11)
        .fillColor('#111827')
        .text('Comentário geral', { underline: true });
      doc.moveDown(0.3);
      doc
        .fontSize(10)
        .fillColor('#374151')
        .text(card.overallComment.trim(), { align: 'justify' });
    }

    doc.moveDown(2);
    doc
      .fontSize(9)
      .fillColor('#9ca3af')
      .text(
        `Documento emitido em ${formatDate(new Date())}. Este boletim reflecte as avaliações do período indicado.`,
        { align: 'center' },
      );

    doc.end();
    const buffer = await done;
    const child = safeFilenamePart(card.student.childFullName || 'aluno');
    const period = safeFilenamePart(card.period.name || 'periodo');
    return {
      buffer,
      filename: `boletim-${child}-${period}.pdf`,
    };
  }
}
