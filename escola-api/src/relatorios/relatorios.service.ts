import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InvoiceStatus, PaymentMethod, Prisma } from '@prisma/client';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';

/** Identidade da escola usada em cabeçalhos de recibos/mapas. */
const ESCOLA = {
  nome: 'BetterYou Kids',
  morada: 'Av. Comandante Gika 150, Sagrada Família, Luanda',
  telefones: '+244 921 669 893 / 943 400 537',
  email: 'escola@betteryoukids.com',
} as const;

/** Rótulos legíveis dos estados de fatura. */
const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  PENDENTE: 'Pendente',
  PAGO: 'Pago',
  VENCIDO: 'Em atraso',
  ANULADO: 'Anulada',
};

/** Rótulos legíveis dos métodos de pagamento. */
const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  NUMERARIO: 'Numerário',
  TRANSFERENCIA: 'Transferência',
  MULTICAIXA: 'Multicaixa',
  TPA: 'TPA',
  OUTRO: 'Outro',
};

/** Rótulos legíveis dos programas/tempos de frequência. */
const FEE_PROGRAM_LABEL: Record<string, string> = {
  MEIO_TEMPO: 'Meio tempo (sem alimentação)',
  MEIO_TEMPO_ALIMENTACAO: 'Meio tempo (com alimentação)',
  TEMPO_INTEIRO: 'Tempo inteiro',
  REGULAR: 'Regular (1.º Ciclo)',
  INTEGRAL: 'Integral (1.º Ciclo)',
};

/** Formata um valor inteiro em AKZ com separador de milhares pt-PT. */
function formatAkz(value: number): string {
  return `${(value ?? 0).toLocaleString('pt-PT')} AKZ`;
}

/** Formata uma data em dd/mm/aaaa (usa componentes UTC para datas @db.Date). */
function formatDate(value: Date | null | undefined): string {
  if (!value) return '—';
  const d = value.getUTCDate().toString().padStart(2, '0');
  const m = (value.getUTCMonth() + 1).toString().padStart(2, '0');
  const y = value.getUTCFullYear();
  return `${d}/${m}/${y}`;
}

/** Valida "AAAA-MM" e devolve o rótulo, ou lança erro. */
function assertMonth(month?: string): string | undefined {
  if (!month) return undefined;
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new BadRequestException('Mês inválido. Utilize o formato AAAA-MM.');
  }
  return month;
}

/** Converte "AAAA-MM-DD" em Date UTC (início do dia), ou lança erro. */
function parseDateOnly(value: string, field: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) throw new BadRequestException(`Data inválida (${field}).`);
  const date = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`Data inválida (${field}).`);
  }
  return date;
}

@Injectable()
export class RelatoriosService {
  constructor(private prisma: PrismaService) {}

  // ─────────────────────────── Excel: mapa de propinas/dívidas ───────────────────────────

  /**
   * Mapa de propinas e dívidas por aluno (serviço, programa, faturado, pago,
   * em dívida, estado). Se `month` for indicado, considera apenas as faturas
   * desse mês de referência.
   */
  async mapaPropinasXlsx(month?: string): Promise<Buffer> {
    const referenceMonth = assertMonth(month);
    const students = await this.prisma.student.findMany({
      orderBy: { childFullName: 'asc' },
      select: {
        id: true,
        childFullName: true,
        guardianFullName: true,
        guardianEmail: true,
        program: true,
        service: { select: { name: true } },
        unit: { select: { name: true } },
        invoices: {
          where: referenceMonth ? { referenceMonth } : undefined,
          select: {
            amountAkz: true,
            status: true,
            referenceMonth: true,
            payments: { select: { amountAkz: true } },
          },
        },
      },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = ESCOLA.nome;
    workbook.created = new Date();
    const sheet = workbook.addWorksheet('Mapa de propinas');

    const titleRow = sheet.addRow([
      referenceMonth
        ? `${ESCOLA.nome} — Mapa de propinas e dívidas (${referenceMonth})`
        : `${ESCOLA.nome} — Mapa de propinas e dívidas`,
    ]);
    titleRow.font = { bold: true, size: 14 };
    sheet.mergeCells(titleRow.number, 1, titleRow.number, 8);
    sheet.addRow([`Emitido em ${formatDate(new Date())}`]);
    sheet.addRow([]);

    const header = sheet.addRow([
      'Aluno',
      'Encarregado',
      'Unidade',
      'Serviço',
      'Programa',
      'Faturado (AKZ)',
      'Pago (AKZ)',
      'Em dívida (AKZ)',
      'Estado',
    ]);
    header.font = { bold: true };
    header.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEFEFEF' },
      };
      cell.border = { bottom: { style: 'thin' } };
    });

    let totalBilled = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;

    for (const s of students) {
      let billed = 0;
      let paid = 0;
      let outstanding = 0;
      for (const inv of s.invoices) {
        if (inv.status === InvoiceStatus.ANULADO) continue;
        const invPaid = inv.payments.reduce((sum, p) => sum + p.amountAkz, 0);
        billed += inv.amountAkz;
        paid += invPaid;
        outstanding += Math.max(inv.amountAkz - invPaid, 0);
      }
      totalBilled += billed;
      totalPaid += paid;
      totalOutstanding += outstanding;
      const estado =
        billed === 0
          ? 'Sem faturação'
          : outstanding > 0
            ? 'Em dívida'
            : 'Regularizado';
      sheet.addRow([
        s.childFullName,
        s.guardianFullName,
        s.unit?.name ?? '—',
        s.service?.name ?? '—',
        s.program ? (FEE_PROGRAM_LABEL[s.program] ?? s.program) : '—',
        billed,
        paid,
        outstanding,
        estado,
      ]);
    }

    const totalsRow = sheet.addRow([
      'TOTAL',
      '',
      '',
      '',
      '',
      totalBilled,
      totalPaid,
      totalOutstanding,
      '',
    ]);
    totalsRow.font = { bold: true };
    totalsRow.eachCell((cell) => {
      cell.border = { top: { style: 'thin' } };
    });

    // Formatação de números (colunas 6-8) e larguras.
    for (let r = 5; r <= sheet.rowCount; r += 1) {
      for (const c of [6, 7, 8]) {
        sheet.getCell(r, c).numFmt = '#,##0';
      }
    }
    sheet.columns.forEach((col, idx) => {
      col.width = idx === 0 || idx === 1 ? 30 : idx >= 5 && idx <= 7 ? 16 : 18;
    });

    return this.workbookToBuffer(workbook);
  }

  // ─────────────────────────── Excel: faturação e pagamentos ───────────────────────────

  /**
   * Faturação (faturas emitidas) e pagamentos (recebidos) num período.
   * `from`/`to` no formato AAAA-MM-DD (inclusive). Sem datas, exporta tudo.
   */
  async faturacaoXlsx(from?: string, to?: string): Promise<Buffer> {
    const fromDate = from ? parseDateOnly(from, 'início') : undefined;
    // O limite superior é inclusivo até ao fim do dia indicado.
    const toDate = to
      ? new Date(parseDateOnly(to, 'fim').getTime() + 24 * 60 * 60 * 1000 - 1)
      : undefined;
    if (fromDate && toDate && fromDate.getTime() > toDate.getTime()) {
      throw new BadRequestException('A data de início é posterior à de fim.');
    }

    const createdAtFilter: Prisma.DateTimeFilter | undefined =
      fromDate || toDate
        ? { ...(fromDate ? { gte: fromDate } : {}), ...(toDate ? { lte: toDate } : {}) }
        : undefined;
    const paidAtFilter: Prisma.DateTimeFilter | undefined =
      fromDate || toDate
        ? { ...(fromDate ? { gte: fromDate } : {}), ...(toDate ? { lte: toDate } : {}) }
        : undefined;

    const [invoices, payments] = await Promise.all([
      this.prisma.invoice.findMany({
        where: createdAtFilter ? { createdAt: createdAtFilter } : {},
        orderBy: { createdAt: 'asc' },
        include: {
          student: { select: { childFullName: true, guardianFullName: true } },
          payments: { select: { amountAkz: true } },
        },
      }),
      this.prisma.payment.findMany({
        where: paidAtFilter ? { paidAt: paidAtFilter } : {},
        orderBy: { paidAt: 'asc' },
        include: {
          invoice: {
            select: {
              referenceMonth: true,
              description: true,
              student: { select: { childFullName: true } },
            },
          },
        },
      }),
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = ESCOLA.nome;
    workbook.created = new Date();

    const periodLabel =
      from || to
        ? `${from ? formatDate(fromDate!) : 'início'} a ${to ? formatDate(parseDateOnly(to, 'fim')) : 'hoje'}`
        : 'todo o histórico';

    // Folha 1 — Faturas
    const fSheet = workbook.addWorksheet('Faturas');
    const fTitle = fSheet.addRow([
      `${ESCOLA.nome} — Faturação (${periodLabel})`,
    ]);
    fTitle.font = { bold: true, size: 14 };
    fSheet.mergeCells(fTitle.number, 1, fTitle.number, 8);
    fSheet.addRow([]);
    const fHeader = fSheet.addRow([
      'Data emissão',
      'Mês ref.',
      'Aluno',
      'Encarregado',
      'Descrição',
      'Valor (AKZ)',
      'Pago (AKZ)',
      'Estado',
    ]);
    fHeader.font = { bold: true };
    let fBilled = 0;
    let fPaid = 0;
    for (const inv of invoices) {
      const paid = inv.payments.reduce((sum, p) => sum + p.amountAkz, 0);
      if (inv.status !== InvoiceStatus.ANULADO) {
        fBilled += inv.amountAkz;
        fPaid += paid;
      }
      fSheet.addRow([
        formatDate(inv.createdAt),
        inv.referenceMonth,
        inv.student?.childFullName ?? '—',
        inv.student?.guardianFullName ?? '—',
        inv.description,
        inv.amountAkz,
        paid,
        INVOICE_STATUS_LABEL[inv.status],
      ]);
    }
    const fTotals = fSheet.addRow([
      'TOTAL (excl. anuladas)',
      '',
      '',
      '',
      '',
      fBilled,
      fPaid,
      '',
    ]);
    fTotals.font = { bold: true };
    for (let r = 4; r <= fSheet.rowCount; r += 1) {
      fSheet.getCell(r, 6).numFmt = '#,##0';
      fSheet.getCell(r, 7).numFmt = '#,##0';
    }
    fSheet.columns.forEach((col, idx) => {
      col.width = idx === 2 || idx === 3 || idx === 4 ? 28 : 15;
    });

    // Folha 2 — Pagamentos
    const pSheet = workbook.addWorksheet('Pagamentos');
    const pTitle = pSheet.addRow([
      `${ESCOLA.nome} — Pagamentos recebidos (${periodLabel})`,
    ]);
    pTitle.font = { bold: true, size: 14 };
    pSheet.mergeCells(pTitle.number, 1, pTitle.number, 6);
    pSheet.addRow([]);
    const pHeader = pSheet.addRow([
      'Data',
      'Aluno',
      'Mês ref.',
      'Método',
      'Referência',
      'Valor (AKZ)',
    ]);
    pHeader.font = { bold: true };
    let pTotal = 0;
    for (const pay of payments) {
      pTotal += pay.amountAkz;
      pSheet.addRow([
        formatDate(pay.paidAt),
        pay.invoice?.student?.childFullName ?? '—',
        pay.invoice?.referenceMonth ?? '—',
        PAYMENT_METHOD_LABEL[pay.method],
        pay.reference ?? pay.receiptRef ?? '—',
        pay.amountAkz,
      ]);
    }
    const pTotals = pSheet.addRow(['TOTAL', '', '', '', '', pTotal]);
    pTotals.font = { bold: true };
    for (let r = 4; r <= pSheet.rowCount; r += 1) {
      pSheet.getCell(r, 6).numFmt = '#,##0';
    }
    pSheet.columns.forEach((col, idx) => {
      col.width = idx === 1 ? 28 : idx === 4 ? 22 : 15;
    });

    return this.workbookToBuffer(workbook);
  }

  // ─────────────────────────── Excel: matrículas / lista de espera ───────────────────────────

  /** Alunos matriculados e entradas em lista de espera (gestão operacional). */
  async matriculasXlsx(): Promise<Buffer> {
    const [students, waitlist] = await Promise.all([
      this.prisma.student.findMany({
        orderBy: { childFullName: 'asc' },
        select: {
          childFullName: true,
          childBirthDate: true,
          guardianFullName: true,
          guardianPhone: true,
          guardianEmail: true,
          profileStatus: true,
          program: true,
          unit: { select: { name: true } },
          service: { select: { name: true } },
          room: { select: { name: true } },
          academicYear: { select: { label: true } },
        },
      }),
      this.prisma.waitlistEntry.findMany({
        orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'asc' }],
        select: {
          status: true,
          priority: true,
          responseDeadline: true,
          createdAt: true,
          room: { select: { name: true } },
          academicYear: { select: { label: true } },
          enrollment: {
            select: {
              childFullName: true,
              guardianFullName: true,
              guardianPhone: true,
              guardianEmail: true,
              unit: { select: { name: true } },
              service: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = ESCOLA.nome;
    workbook.created = new Date();

    const mSheet = workbook.addWorksheet('Matrículas');
    const mTitle = mSheet.addRow([`${ESCOLA.nome} — Alunos matriculados`]);
    mTitle.font = { bold: true, size: 14 };
    mSheet.mergeCells(mTitle.number, 1, mTitle.number, 9);
    mSheet.addRow([]);
    const mHeader = mSheet.addRow([
      'Aluno',
      'Nascimento',
      'Encarregado',
      'Telefone',
      'Email',
      'Unidade',
      'Serviço',
      'Sala',
      'Ficha',
    ]);
    mHeader.font = { bold: true };
    for (const s of students) {
      mSheet.addRow([
        s.childFullName,
        formatDate(s.childBirthDate),
        s.guardianFullName,
        s.guardianPhone,
        s.guardianEmail,
        s.unit?.name ?? '—',
        s.service?.name ?? '—',
        s.room?.name ?? '—',
        s.profileStatus === 'COMPLETA' ? 'Completa' : 'Pendente',
      ]);
    }
    mSheet.columns.forEach((col, idx) => {
      col.width = idx === 0 || idx === 2 || idx === 4 ? 28 : 15;
    });

    const wSheet = workbook.addWorksheet('Lista de espera');
    const wTitle = wSheet.addRow([`${ESCOLA.nome} — Lista de espera`]);
    wTitle.font = { bold: true, size: 14 };
    wSheet.mergeCells(wTitle.number, 1, wTitle.number, 8);
    wSheet.addRow([]);
    const wHeader = wSheet.addRow([
      'Criança',
      'Encarregado',
      'Telefone',
      'Unidade',
      'Serviço',
      'Prioridade',
      'Estado',
      'Prazo resposta',
    ]);
    wHeader.font = { bold: true };
    for (const w of waitlist) {
      wSheet.addRow([
        w.enrollment?.childFullName ?? '—',
        w.enrollment?.guardianFullName ?? '—',
        w.enrollment?.guardianPhone ?? '—',
        w.enrollment?.unit?.name ?? '—',
        w.enrollment?.service?.name ?? '—',
        w.priority,
        w.status,
        formatDate(w.responseDeadline),
      ]);
    }
    wSheet.columns.forEach((col, idx) => {
      col.width = idx === 0 || idx === 1 ? 28 : 15;
    });

    return this.workbookToBuffer(workbook);
  }

  // ─────────────────────────── PDF: recibo de pagamento ───────────────────────────

  /** Recibo de um pagamento em PDF. Devolve o buffer e o nome do ficheiro. */
  async reciboPdf(
    paymentId: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: {
          include: {
            student: {
              select: {
                childFullName: true,
                guardianFullName: true,
                guardianEmail: true,
                guardianPhone: true,
                service: { select: { name: true } },
              },
            },
            feePlan: { select: { name: true } },
          },
        },
      },
    });
    if (!payment) throw new NotFoundException('Pagamento não encontrado.');

    const invoice = payment.invoice;
    const student = invoice.student;
    const paidTotalPromise = this.prisma.payment.aggregate({
      where: { invoiceId: invoice.id },
      _sum: { amountAkz: true },
    });
    const paidTotal = (await paidTotalPromise)._sum.amountAkz ?? 0;
    const outstanding = Math.max(invoice.amountAkz - paidTotal, 0);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    const receiptNumber = payment.receiptRef || payment.id.slice(-8).toUpperCase();

    // Cabeçalho da escola.
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

    // Título do documento.
    doc
      .fontSize(16)
      .fillColor('#111827')
      .text('RECIBO DE PAGAMENTO', { align: 'center' });
    doc
      .fontSize(10)
      .fillColor('#6b7280')
      .text(`N.º ${receiptNumber}`, { align: 'center' });
    doc.moveDown(1);

    const label = (text: string) =>
      doc.fontSize(10).fillColor('#6b7280').text(text, { continued: true });
    const value = (text: string) =>
      doc.fontSize(10).fillColor('#111827').text(` ${text}`);

    label('Aluno:');
    value(student?.childFullName ?? '—');
    label('Encarregado de educação:');
    value(student?.guardianFullName ?? '—');
    if (student?.guardianEmail) {
      label('Email:');
      value(student.guardianEmail);
    }
    if (student?.guardianPhone) {
      label('Telefone:');
      value(student.guardianPhone);
    }
    if (student?.service?.name) {
      label('Serviço:');
      value(student.service.name);
    }
    doc.moveDown(0.5);
    label('Fatura / Mês de referência:');
    value(`${invoice.referenceMonth} — ${invoice.description}`);
    label('Data do pagamento:');
    value(formatDate(payment.paidAt));
    label('Método de pagamento:');
    value(PAYMENT_METHOD_LABEL[payment.method]);
    if (payment.reference) {
      label('Referência da transação:');
      value(payment.reference);
    }
    doc.moveDown(1);

    // Caixa de valor pago.
    const boxTop = doc.y;
    doc
      .roundedRect(50, boxTop, 495, 60, 6)
      .fillAndStroke('#f9fafb', '#e5e7eb');
    doc
      .fillColor('#6b7280')
      .fontSize(11)
      .text('Valor recebido', 65, boxTop + 12);
    doc
      .fillColor('#065f46')
      .fontSize(22)
      .text(formatAkz(payment.amountAkz), 65, boxTop + 28);
    doc.y = boxTop + 72;
    doc.moveDown(0.5);

    // Resumo da fatura.
    doc
      .fontSize(10)
      .fillColor('#374151')
      .text(`Total da fatura: ${formatAkz(invoice.amountAkz)}`)
      .text(`Total pago até à data: ${formatAkz(paidTotal)}`)
      .text(
        outstanding > 0
          ? `Saldo em dívida: ${formatAkz(outstanding)}`
          : 'Fatura totalmente regularizada.',
      );

    doc.moveDown(3);
    doc
      .fontSize(9)
      .fillColor('#9ca3af')
      .text(
        `Documento emitido em ${formatDate(new Date())}. Este recibo comprova o pagamento acima descrito.`,
        { align: 'center' },
      );

    doc.end();
    const buffer = await done;
    const safeName = (student?.childFullName ?? 'aluno')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .toLowerCase();
    return {
      buffer,
      filename: `recibo-${safeName}-${invoice.referenceMonth}.pdf`,
    };
  }

  // ─────────────────────────── PDF: mapa financeiro mensal ───────────────────────────

  /** Resumo financeiro mensal (faturação, recebido e em dívida) em PDF. */
  async mapaFinanceiroPdf(month?: string): Promise<Buffer> {
    const referenceMonth = assertMonth(month);
    const invoices = await this.prisma.invoice.findMany({
      where: referenceMonth ? { referenceMonth } : undefined,
      include: {
        student: { select: { childFullName: true } },
        payments: { select: { amountAkz: true } },
      },
      orderBy: [{ referenceMonth: 'desc' }, { createdAt: 'asc' }],
    });

    let billed = 0;
    let paid = 0;
    let outstanding = 0;
    const byStatus: Record<string, number> = {};
    for (const inv of invoices) {
      byStatus[inv.status] = (byStatus[inv.status] ?? 0) + 1;
      if (inv.status === InvoiceStatus.ANULADO) continue;
      const invPaid = inv.payments.reduce((sum, p) => sum + p.amountAkz, 0);
      billed += inv.amountAkz;
      paid += invPaid;
      outstanding += Math.max(inv.amountAkz - invPaid, 0);
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    doc.fontSize(20).fillColor('#1f2937').text(ESCOLA.nome);
    doc
      .fontSize(9)
      .fillColor('#4b5563')
      .text(ESCOLA.morada)
      .text(`Tel./WhatsApp: ${ESCOLA.telefones}`)
      .text(`Email: ${ESCOLA.email}`);
    doc.moveDown(0.5);
    doc
      .strokeColor('#e5e7eb')
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke();
    doc.moveDown(1);

    doc
      .fontSize(16)
      .fillColor('#111827')
      .text(
        referenceMonth
          ? `Mapa financeiro mensal — ${referenceMonth}`
          : 'Mapa financeiro — histórico',
        { align: 'center' },
      );
    doc.moveDown(1);

    doc.fontSize(11).fillColor('#374151');
    doc.text(`Faturas consideradas: ${invoices.length}`);
    doc.text(`Total faturado (excl. anuladas): ${formatAkz(billed)}`);
    doc.text(`Total recebido: ${formatAkz(paid)}`);
    doc.text(`Total em dívida: ${formatAkz(outstanding)}`);
    doc.moveDown(0.8);

    doc.fontSize(12).fillColor('#111827').text('Faturas por estado');
    doc.fontSize(10).fillColor('#374151');
    for (const status of Object.keys(byStatus)) {
      const label = INVOICE_STATUS_LABEL[status as InvoiceStatus] ?? status;
      doc.text(`• ${label}: ${byStatus[status]}`);
    }

    doc.moveDown(3);
    doc
      .fontSize(9)
      .fillColor('#9ca3af')
      .text(`Documento emitido em ${formatDate(new Date())}.`, {
        align: 'center',
      });

    doc.end();
    return done;
  }

  // ─────────────────────────── Utilitário ───────────────────────────

  private async workbookToBuffer(workbook: ExcelJS.Workbook): Promise<Buffer> {
    const data = await workbook.xlsx.writeBuffer();
    return Buffer.from(data);
  }
}
