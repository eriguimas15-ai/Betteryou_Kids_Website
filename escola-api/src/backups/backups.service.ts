import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { spawn } from 'child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
} from 'fs';
import { join, resolve } from 'path';
import { AuditService } from '../common/audit/audit.service';

type DbConfig = {
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
};

export type BackupFile = {
  name: string;
  sizeBytes: number;
  createdAt: Date;
};

/**
 * Cópias de segurança da base de dados MySQL via mysqldump.
 * Vocacionado para ambiente Laragon/Windows, mas resolve o mysqldump de
 * várias origens. Nunca apaga dados.
 */
@Injectable()
export class BackupsService {
  private readonly logger = new Logger(BackupsService.name);

  constructor(private audit: AuditService) {}

  /** Pasta onde as cópias são guardadas (escola-api/backups). */
  private backupsDir(): string {
    const dir = resolve(process.cwd(), process.env.BACKUP_DIR || 'backups');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return dir;
  }

  /** Lê e valida o DATABASE_URL da aplicação. */
  private parseDbConfig(): DbConfig {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new BadRequestException('DATABASE_URL não configurado.');
    }
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new BadRequestException('DATABASE_URL inválido.');
    }
    const database = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
    if (!database) {
      throw new BadRequestException(
        'Base de dados em falta no DATABASE_URL.',
      );
    }
    return {
      host: parsed.hostname || '127.0.0.1',
      port: parsed.port || '3306',
      user: decodeURIComponent(parsed.username || 'root'),
      password: decodeURIComponent(parsed.password || ''),
      database,
    };
  }

  /** Resolve o executável mysqldump (env → PATH → localizações comuns). */
  private resolveMysqldump(): string | null {
    if (process.env.MYSQLDUMP_PATH && existsSync(process.env.MYSQLDUMP_PATH)) {
      return process.env.MYSQLDUMP_PATH;
    }

    const candidates: string[] = [];
    // Laragon: C:\laragon\bin\mysql\<versão>\bin\mysqldump.exe
    for (const base of [
      'C:\\laragon\\bin\\mysql',
      'C:\\laragon\\bin\\mariadb',
    ]) {
      try {
        if (existsSync(base)) {
          for (const entry of readdirSync(base)) {
            candidates.push(join(base, entry, 'bin', 'mysqldump.exe'));
          }
        }
      } catch {
        // ignorar
      }
    }
    candidates.push('C:\\xampp\\mysql\\bin\\mysqldump.exe');
    candidates.push('C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe');

    for (const candidate of candidates) {
      if (existsSync(candidate)) return candidate;
    }

    // Deixar o SO resolver via PATH (retornamos o nome nu).
    return 'mysqldump';
  }

  private timestamp(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
      `-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
    );
  }

  /** Cria uma cópia de segurança agora. */
  async createBackup(actorId?: string | null): Promise<{
    ok: boolean;
    file: string;
    sizeBytes: number;
    message: string;
  }> {
    const config = this.parseDbConfig();
    const bin = this.resolveMysqldump();
    const dir = this.backupsDir();
    const fileName = `backup-${config.database}-${this.timestamp()}.sql`;
    const filePath = join(dir, fileName);

    const args = [
      `-h${config.host}`,
      `-P${config.port}`,
      `-u${config.user}`,
      '--single-transaction',
      '--routines',
      '--events',
      '--skip-lock-tables',
      `--result-file=${filePath}`,
      config.database,
    ];

    await new Promise<void>((resolvePromise, rejectPromise) => {
      let child;
      try {
        child = spawn(bin || 'mysqldump', args, {
          env: {
            ...process.env,
            // Password via ambiente evita expô-la na linha de comandos.
            ...(config.password ? { MYSQL_PWD: config.password } : {}),
          },
          windowsHide: true,
        });
      } catch (error) {
        rejectPromise(this.wrapSpawnError(error));
        return;
      }

      let stderr = '';
      child.stderr?.on('data', (chunk) => {
        stderr += chunk.toString();
      });
      child.on('error', (error) => {
        rejectPromise(this.wrapSpawnError(error));
      });
      child.on('close', (code) => {
        if (code === 0) {
          resolvePromise();
        } else {
          rejectPromise(
            new BadRequestException(
              `mysqldump terminou com código ${code}. ${stderr.trim() || ''}`.trim(),
            ),
          );
        }
      });
    });

    if (!existsSync(filePath)) {
      throw new BadRequestException(
        'A cópia não foi criada (ficheiro inexistente).',
      );
    }
    const sizeBytes = statSync(filePath).size;

    await this.audit.record({
      userId: actorId ?? null,
      action: 'BACKUP_CREATED',
      entity: 'Backup',
      entityId: fileName,
      metadata: { database: config.database, sizeBytes },
    });

    return {
      ok: true,
      file: fileName,
      sizeBytes,
      message: `Cópia criada: ${fileName} (${(sizeBytes / 1024).toFixed(1)} KB).`,
    };
  }

  /** Transforma erros de spawn (ex.: ENOENT) em mensagens claras. */
  private wrapSpawnError(error: unknown): BadRequestException {
    const err = error as NodeJS.ErrnoException;
    if (err?.code === 'ENOENT') {
      return new BadRequestException(
        'mysqldump não encontrado. Instale o cliente MySQL ou defina ' +
          'MYSQLDUMP_PATH no .env (ex.: C:\\laragon\\bin\\mysql\\...\\bin\\mysqldump.exe).',
      );
    }
    return new BadRequestException(
      `Não foi possível executar o mysqldump: ${err?.message || String(error)}`,
    );
  }

  /** Lista as cópias existentes (mais recentes primeiro). */
  listBackups(): BackupFile[] {
    const dir = this.backupsDir();
    return readdirSync(dir)
      .filter((name) => name.endsWith('.sql'))
      .map((name) => {
        const stat = statSync(join(dir, name));
        return { name, sizeBytes: stat.size, createdAt: stat.mtime };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /** Devolve o conteúdo de uma cópia para download (com validação do nome). */
  getBackupFile(name: string): { path: string; content: Buffer } {
    if (!/^[\w.-]+\.sql$/.test(name)) {
      throw new BadRequestException('Nome de ficheiro inválido.');
    }
    const filePath = join(this.backupsDir(), name);
    if (!existsSync(filePath)) {
      throw new NotFoundException('Cópia não encontrada.');
    }
    return { path: filePath, content: readFileSync(filePath) };
  }

  /** Indica se o mysqldump está disponível (para a UI avisar). */
  status(): { mysqldumpResolved: string; available: boolean; dir: string } {
    const bin = this.resolveMysqldump();
    const available =
      !!bin && (bin === 'mysqldump' ? true : existsSync(bin));
    return { mysqldumpResolved: bin ?? 'n/d', available, dir: this.backupsDir() };
  }

  /** Cópia diária automática às 03:00 (best-effort). */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async dailyBackup() {
    try {
      await this.createBackup(null);
      this.logger.log('Cópia de segurança diária concluída.');
    } catch (error) {
      this.logger.warn(
        `Cópia de segurança diária falhou: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
