import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import {
  DEFAULT_PROFILE_MODULES,
  PLATFORM_MODULES,
  parseModules,
} from '../common/platform-modules';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  listModules() {
    return PLATFORM_MODULES;
  }

  listProfiles() {
    return this.prisma.accessProfile.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { users: true } } },
    });
  }

  async createProfile(data: {
    name: string;
    description?: string;
    modules: string[];
    systemKey?: string;
  }) {
    return this.prisma.accessProfile.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        systemKey: data.systemKey?.trim() || null,
        modules: data.modules,
      },
    });
  }

  async updateProfile(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      modules?: string[];
      active?: boolean;
    },
  ) {
    await this.getProfileOrThrow(id);
    return this.prisma.accessProfile.update({
      where: { id },
      data: {
        ...(data.name != null ? { name: data.name.trim() } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.modules != null ? { modules: data.modules } : {}),
        ...(data.active != null ? { active: data.active } : {}),
      },
    });
  }

  async deleteProfile(id: string) {
    const profile = await this.getProfileOrThrow(id);
    if (profile.systemKey === 'ADMIN') {
      throw new BadRequestException('O perfil Administrador não pode ser removido');
    }
    const users = await this.prisma.user.count({
      where: { accessProfileId: id },
    });
    if (users > 0) {
      throw new BadRequestException(
        'Existem utilizadores com este perfil. Reatribua-os antes de remover.',
      );
    }
    await this.prisma.accessProfile.delete({ where: { id } });
    return { ok: true };
  }

  listUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        accessProfileId: true,
        accessProfile: {
          select: { id: true, name: true, modules: true, systemKey: true },
        },
      },
    });
  }

  async createUser(data: {
    name: string;
    email: string;
    password: string;
    role?: Role;
    accessProfileId?: string;
    active?: boolean;
  }) {
    const email = data.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('Já existe um utilizador com este email');
    }

    let profileId = data.accessProfileId;
    let role = data.role || Role.COMUNICACAO;

    if (profileId) {
      const profile = await this.getProfileOrThrow(profileId);
      if (profile.systemKey && Object.values(Role).includes(profile.systemKey as Role)) {
        role = profile.systemKey as Role;
      }
    } else {
      const byRole = await this.prisma.accessProfile.findUnique({
        where: { systemKey: role },
      });
      profileId = byRole?.id;
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    return this.prisma.user.create({
      data: {
        name: data.name.trim(),
        email,
        passwordHash,
        role,
        accessProfileId: profileId || null,
        active: data.active ?? true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        accessProfileId: true,
        createdAt: true,
      },
    });
  }

  async updateUser(
    id: string,
    data: {
      name?: string;
      email?: string;
      password?: string;
      role?: Role;
      accessProfileId?: string | null;
      active?: boolean;
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilizador não encontrado');

    let role = data.role ?? user.role;
    let accessProfileId =
      data.accessProfileId !== undefined
        ? data.accessProfileId
        : user.accessProfileId;

    if (data.accessProfileId) {
      const profile = await this.getProfileOrThrow(data.accessProfileId);
      if (profile.systemKey && Object.values(Role).includes(profile.systemKey as Role)) {
        role = profile.systemKey as Role;
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(data.name != null ? { name: data.name.trim() } : {}),
        ...(data.email != null
          ? { email: data.email.trim().toLowerCase() }
          : {}),
        ...(data.password
          ? { passwordHash: await bcrypt.hash(data.password, 12) }
          : {}),
        role,
        accessProfileId,
        ...(data.active != null ? { active: data.active } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        accessProfileId: true,
        createdAt: true,
      },
    });
  }

  async ensureDefaultProfiles() {
    for (const [systemKey, modules] of Object.entries(DEFAULT_PROFILE_MODULES)) {
      const name =
        systemKey === 'ADMIN'
          ? 'Administrador'
          : systemKey === 'DIRECAO'
            ? 'Direcção'
            : systemKey === 'COMUNICACAO'
              ? 'Comunicação'
              : systemKey === 'COORDENACAO'
                ? 'Coordinação'
                : systemKey === 'PROFESSOR'
                  ? 'Professor'
                  : systemKey === 'ENCARREGADO'
                    ? 'Encarregado'
                    : 'Aluno';

      await this.prisma.accessProfile.upsert({
        where: { systemKey },
        update: { modules, active: true },
        create: {
          name,
          systemKey,
          description: `Perfil padrão ${name}`,
          modules,
        },
      });
    }

    const profiles = await this.prisma.accessProfile.findMany({
      where: { systemKey: { not: null } },
    });
    for (const profile of profiles) {
      if (!profile.systemKey) continue;
      await this.prisma.user.updateMany({
        where: {
          role: profile.systemKey as Role,
          accessProfileId: null,
        },
        data: { accessProfileId: profile.id },
      });
    }
  }

  async modulesForUser(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { accessProfile: true },
    });
    if (!user || !user.active) return [];
    if (user.role === Role.ADMIN) {
      return PLATFORM_MODULES.map((m) => m.key);
    }
    if (user.accessProfile?.active) {
      return parseModules(user.accessProfile.modules);
    }
    return DEFAULT_PROFILE_MODULES[user.role] || [];
  }

  private async getProfileOrThrow(id: string) {
    const profile = await this.prisma.accessProfile.findUnique({
      where: { id },
    });
    if (!profile) throw new NotFoundException('Perfil não encontrado');
    return profile;
  }
}
