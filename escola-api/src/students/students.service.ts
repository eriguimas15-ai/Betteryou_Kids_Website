import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, StudentProfileStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  assertSharedFormComplete,
  primaryPersonFields,
  type EmergencyInput,
  type GuardianInput,
} from '../common/person-form';

export type FichaPayload = {
  childFullName?: string;
  childBirthDate?: string;
  childSex?: string;
  childBirthPlace?: string;
  childNationality?: string;
  childAddress?: string;
  guardianFullName?: string;
  guardianIdNumber?: string;
  guardianPhone?: string;
  guardianAltPhone?: string;
  guardianEmail?: string;
  guardianProfession?: string;
  guardianRelationship?: string;
  guardianAddress?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  allergies?: string;
  medication?: string;
  foodRestrictions?: string;
  medicalNotes?: string;
  guardians?: GuardianInput[];
  emergencyContacts?: EmergencyInput[];
  activities?: string[];
};

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async createFromEnrollment(enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });
    if (!enrollment) return null;

    const existing = await this.prisma.student.findUnique({
      where: { enrollmentId },
    });
    if (existing) return existing;

    const guardian = await this.prisma.user.findUnique({
      where: { email: enrollment.guardianEmail.toLowerCase() },
    });

    return this.prisma.student.create({
      data: {
        enrollmentId: enrollment.id,
        guardianUserId: guardian?.id || null,
        academicYearId: enrollment.academicYearId,
        unitId: enrollment.unitId,
        serviceId: enrollment.serviceId,
        roomId: enrollment.roomId,
        childFullName: enrollment.childFullName,
        childBirthDate: enrollment.childBirthDate,
        childSex: enrollment.childSex,
        childBirthPlace: enrollment.childBirthPlace,
        childNationality: enrollment.childNationality,
        childAddress: enrollment.childAddress,
        guardianFullName: enrollment.guardianFullName,
        guardianIdNumber: enrollment.guardianIdNumber,
        guardianPhone: enrollment.guardianPhone,
        guardianAltPhone: enrollment.guardianAltPhone,
        guardianEmail: enrollment.guardianEmail,
        guardianProfession: enrollment.guardianProfession,
        guardianRelationship: enrollment.guardianRelationship,
        guardianAddress: enrollment.guardianAddress,
        emergencyName: enrollment.emergencyName,
        emergencyPhone: enrollment.emergencyPhone,
        emergencyRelation: enrollment.emergencyRelation,
        allergies: enrollment.allergies,
        medication: enrollment.medication,
        foodRestrictions: enrollment.foodRestrictions,
        medicalNotes: enrollment.medicalNotes,
        guardians: enrollment.guardians ?? undefined,
        emergencyContacts: enrollment.emergencyContacts ?? undefined,
        activities: enrollment.activities ?? undefined,
        profileStatus: StudentProfileStatus.PENDENTE_FICHA,
      },
    });
  }

  async createFromRenewal(renewalId: string) {
    const renewal = await this.prisma.renewal.findUnique({
      where: { id: renewalId },
    });
    if (!renewal || renewal.status !== 'CONFIRMADA') return null;

    const existing = await this.prisma.student.findUnique({
      where: { renewalId },
    });
    if (existing) return existing;

    const guardian = await this.prisma.user.findUnique({
      where: { email: renewal.guardianEmail.toLowerCase() },
    });

    return this.prisma.student.create({
      data: {
        renewalId: renewal.id,
        guardianUserId: guardian?.id || null,
        academicYearId: renewal.academicYearId,
        unitId: renewal.unitId,
        serviceId: renewal.serviceId,
        roomId: renewal.roomId,
        childFullName: renewal.childFullName,
        childBirthDate: renewal.childBirthDate,
        childSex: renewal.childSex,
        childBirthPlace: renewal.childBirthPlace,
        childNationality: renewal.childNationality,
        childAddress: renewal.childAddress,
        guardianFullName: renewal.guardianFullName,
        guardianIdNumber: renewal.guardianIdNumber,
        guardianPhone: renewal.guardianPhone,
        guardianAltPhone: renewal.guardianAltPhone,
        guardianEmail: renewal.guardianEmail,
        guardianProfession: renewal.guardianProfession,
        guardianRelationship: renewal.guardianRelationship,
        guardianAddress: renewal.guardianAddress,
        emergencyName: renewal.emergencyName,
        emergencyPhone: renewal.emergencyPhone,
        emergencyRelation: renewal.emergencyRelation,
        allergies: renewal.allergies,
        medication: renewal.medication,
        foodRestrictions: renewal.foodRestrictions,
        medicalNotes: renewal.medicalNotes,
        guardians: renewal.guardians ?? undefined,
        emergencyContacts: renewal.emergencyContacts ?? undefined,
        activities: renewal.activities ?? undefined,
        profileStatus: StudentProfileStatus.PENDENTE_FICHA,
      },
    });
  }

  async linkGuardianByEmail(userId: string, email: string) {
    await this.prisma.student.updateMany({
      where: {
        guardianEmail: email.toLowerCase(),
        guardianUserId: null,
      },
      data: { guardianUserId: userId },
    });
  }

  listMine(user: { id: string; email: string; role: string }) {
    if (
      user.role === Role.ADMIN ||
      user.role === Role.DIRECAO ||
      user.role === Role.COORDENACAO
    ) {
      return this.prisma.student.findMany({
        include: {
          unit: true,
          service: true,
          academicYear: true,
          room: true,
        },
        orderBy: { updatedAt: 'desc' },
      });
    }
    return this.prisma.student.findMany({
      where: {
        OR: [
          { guardianUserId: user.id },
          { guardianEmail: user.email.toLowerCase() },
        ],
      },
      include: {
        unit: true,
        service: true,
        academicYear: true,
        room: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getOne(id: string, user: { id: string; email: string; role: string }) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        unit: true,
        service: true,
        academicYear: true,
        room: true,
      },
    });
    if (!student) throw new NotFoundException('Ficha não encontrada');
    this.assertCanAccess(student, user);
    return student;
  }

  async updateFicha(
    id: string,
    user: { id: string; email: string; role: string },
    data: FichaPayload,
  ) {
    const student = await this.getOne(id, user);
    const merged = {
      childFullName: data.childFullName ?? student.childFullName,
      childBirthDate:
        data.childBirthDate ??
        (student.childBirthDate
          ? student.childBirthDate.toISOString().slice(0, 10)
          : undefined),
      childSex: data.childSex ?? student.childSex ?? undefined,
      childBirthPlace:
        data.childBirthPlace ?? student.childBirthPlace ?? undefined,
      childNationality:
        data.childNationality ?? student.childNationality ?? undefined,
      childAddress: data.childAddress ?? student.childAddress ?? undefined,
      allergies: data.allergies ?? student.allergies ?? undefined,
      medication: data.medication ?? student.medication ?? undefined,
      foodRestrictions:
        data.foodRestrictions ?? student.foodRestrictions ?? undefined,
      medicalNotes: data.medicalNotes ?? student.medicalNotes ?? undefined,
      guardians:
        data.guardians ??
        (student.guardians as GuardianInput[] | null) ??
        undefined,
      emergencyContacts:
        data.emergencyContacts ??
        (student.emergencyContacts as EmergencyInput[] | null) ??
        undefined,
      activities:
        data.activities ??
        (student.activities as string[] | null) ??
        undefined,
      guardianFullName: data.guardianFullName ?? student.guardianFullName,
      guardianIdNumber:
        data.guardianIdNumber ?? student.guardianIdNumber ?? undefined,
      guardianPhone: data.guardianPhone ?? student.guardianPhone,
      guardianAltPhone:
        data.guardianAltPhone ?? student.guardianAltPhone ?? undefined,
      guardianEmail: data.guardianEmail ?? student.guardianEmail,
      guardianProfession:
        data.guardianProfession ?? student.guardianProfession ?? undefined,
      guardianRelationship:
        data.guardianRelationship ??
        student.guardianRelationship ??
        undefined,
      guardianAddress:
        data.guardianAddress ?? student.guardianAddress ?? undefined,
      emergencyName: data.emergencyName ?? student.emergencyName ?? undefined,
      emergencyPhone:
        data.emergencyPhone ?? student.emergencyPhone ?? undefined,
      emergencyRelation:
        data.emergencyRelation ?? student.emergencyRelation ?? undefined,
    };

    assertSharedFormComplete(merged);
    const person = primaryPersonFields(merged);

    return this.prisma.student.update({
      where: { id: student.id },
      data: {
        childFullName: merged.childFullName.trim(),
        childBirthDate: merged.childBirthDate
          ? new Date(merged.childBirthDate)
          : student.childBirthDate,
        childSex: merged.childSex || null,
        childBirthPlace: merged.childBirthPlace || null,
        childNationality: merged.childNationality || null,
        childAddress: merged.childAddress || null,
        ...person.flat,
        guardians: person.guardians,
        emergencyContacts: person.emergencies,
        activities: person.activities,
        profileStatus: StudentProfileStatus.COMPLETA,
        guardianUserId: student.guardianUserId || user.id,
      },
      include: {
        unit: true,
        service: true,
        academicYear: true,
        room: true,
      },
    });
  }

  private assertCanAccess(
    student: { guardianUserId: string | null; guardianEmail: string },
    user: { id: string; email: string; role: string },
  ) {
    if (
      user.role === Role.ADMIN ||
      user.role === Role.DIRECAO ||
      user.role === Role.COORDENACAO
    ) {
      return;
    }
    const emailMatch =
      student.guardianEmail.toLowerCase() === user.email.toLowerCase();
    const userMatch = student.guardianUserId === user.id;
    if (!emailMatch && !userMatch) {
      throw new ForbiddenException('Sem acesso a esta ficha');
    }
  }
}
