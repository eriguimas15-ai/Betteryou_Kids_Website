import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.serviceOffering.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  create(data: { name: string; description?: string }) {
    return this.prisma.serviceOffering.create({ data });
  }

  update(
    id: string,
    data: { name?: string; description?: string; active?: boolean },
  ) {
    return this.prisma.serviceOffering.update({ where: { id }, data });
  }
}
