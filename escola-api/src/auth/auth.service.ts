import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private users: UsersService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ForbiddenException('Já existe uma conta com este email');
    }
    await this.users.ensureDefaultProfiles();
    const encarregadoProfile = await this.prisma.accessProfile.findUnique({
      where: { systemKey: 'ENCARREGADO' },
    });
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        passwordHash,
        role: Role.ENCARREGADO,
        accessProfileId: encarregadoProfile?.id || null,
      },
    });
    await this.prisma.student.updateMany({
      where: { guardianEmail: email, guardianUserId: null },
      data: { guardianUserId: user.id },
    });
    return this.issueTokens(user.id, user.email, user.role, user.name);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user || !user.active) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    return this.issueTokens(user.id, user.email, user.role, user.name);
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
    if (!stored.user.active) {
      throw new ForbiddenException('Utilizador inactivo');
    }
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    return this.issueTokens(
      stored.user.id,
      stored.user.email,
      stored.user.role,
      stored.user.name,
    );
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) return { ok: true };
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.deleteMany({ where: { tokenHash } });
    return { ok: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        accessProfile: {
          select: { id: true, name: true, modules: true },
        },
      },
    });
    if (!user) throw new UnauthorizedException();
    const modules = await this.users.modulesForUser(userId);
    return { ...user, modules };
  }

  private async issueTokens(
    userId: string,
    email: string,
    role: string,
    name: string,
  ) {
    const payload = { sub: userId, email, role };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN') || '12h',
    } as Parameters<JwtService['signAsync']>[1]);
    const refreshToken = randomBytes(48).toString('hex');
    const days = this.parseDays(this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'));
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      },
    });
    const modules = await this.users.modulesForUser(userId);
    return {
      accessToken,
      refreshToken,
      user: { id: userId, email, role, name, modules },
    };
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseDays(value: string) {
    const match = /^(\d+)d$/.exec(value);
    return match ? Number(match[1]) : 7;
  }
}
