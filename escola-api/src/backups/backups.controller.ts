import { Controller, Get, Param, Post, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BackupsService } from './backups.service';

type RequestUser = { id: string; email: string; role: string };

@ApiTags('backups')
@ApiBearerAuth()
@Controller('backups')
export class BackupsController {
  constructor(private backups: BackupsService) {}

  @Roles(Role.ADMIN)
  @Get()
  list() {
    return {
      status: this.backups.status(),
      backups: this.backups.listBackups(),
    };
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@CurrentUser() user: RequestUser) {
    return this.backups.createBackup(user?.id);
  }

  @Roles(Role.ADMIN)
  @Get(':name/download')
  download(@Param('name') name: string, @Res() res: Response) {
    const { content } = this.backups.getBackupFile(name);
    res.set({
      'Content-Type': 'application/sql',
      'Content-Disposition': `attachment; filename="${name}"`,
      'Content-Length': content.length.toString(),
    });
    res.end(content);
  }
}
