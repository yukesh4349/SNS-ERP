import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuthUser } from '../auth/auth.types';
import { PasswordUtils } from '../common/utils/password.utils';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedAdmin();
  }

  private async seedAdmin() {
    const adminEmail = process.env.DEMO_USER_EMAIL ?? 'admin@sns-erp.local';
    const adminPassword = process.env.DEMO_USER_PASSWORD ?? 'ChangeMe123!';
    const existing = await this.prisma.user.findUnique({
      where: { email: adminEmail.toLowerCase() },
    });

    if (!existing) {
      const hashedPassword = await PasswordUtils.hashPassword(adminPassword);
      await this.prisma.user.create({
        data: {
          email: adminEmail.toLowerCase(),
          password: hashedPassword,
          name: process.env.DEMO_USER_NAME ?? 'SNS ERP Admin',
          role: 'admin',
          department: 'Administration',
          status: 'active',
        },
      });
    } else {
      // If the stored password is not yet hashed, hash it
      if (!PasswordUtils.isHashed(existing.password)) {
        const hashedPassword = await PasswordUtils.hashPassword(adminPassword);
        await this.prisma.user.update({
          where: { id: existing.id },
          data: { password: hashedPassword },
        });
      }
    }
  }

  async getClasses() {
    const grouped = await this.prisma.studentProfile.groupBy({
      by: ['class', 'section'],
      _count: {
        _all: true,
      },
    });

    const result = grouped.map((g) => ({
      class: g.class,
      section: g.section,
      studentCount: g._count._all,
    }));

    return result.sort((a, b) => {
      const classCompare = a.class.localeCompare(b.class, undefined, { numeric: true });
      if (classCompare !== 0) return classCompare;
      return a.section.localeCompare(b.section);
    });
  }

  async getSystemStats() {
    const [totalStudents, totalTeachers, totalAdmins] = await Promise.all([
      this.prisma.user.count({ where: { role: 'parent' } }),
      this.prisma.user.count({ where: { role: 'teacher' } }),
      this.prisma.user.count({ where: { role: 'admin' } }),
    ]);

    return {
      totalStudents,
      totalTeachers,
      totalAdmins,
      totalUsers: totalStudents + totalTeachers + totalAdmins,
    };
  }

  async getUsersStats(userId: string) {
    const [totalStudents, totalTeachers, totalAdmins] = await Promise.all([
      this.prisma.user.count({ where: { role: 'parent' } }),
      this.prisma.user.count({ where: { role: 'teacher' } }),
      this.prisma.user.count({ where: { role: 'admin' } }),
    ]);

    const teacherProfile = await this.prisma.teacherProfile.findUnique({
      where: { userId },
    });

    const isClassTeacher = !!(teacherProfile?.class && teacherProfile?.section);
    let classStudents = 0;
    if (isClassTeacher && teacherProfile?.class && teacherProfile?.section) {
      const targetClass = teacherProfile.class;
      const targetSection = teacherProfile.section;
      classStudents = await this.prisma.studentProfile.count({
        where: {
          class: targetClass,
          section: targetSection,
        },
      });
    }

    return {
      totalStudents,
      totalTeachers,
      totalAdmins,
      totalUsers: totalStudents + totalTeachers + totalAdmins,
      isClassTeacher,
      className: isClassTeacher ? `${teacherProfile.class}-${teacherProfile.section}` : undefined,
      classStudents,
    };
  }

  async getBirthdays() {
    const users = await this.prisma.user.findMany({
      where: {
        status: 'active',
      },
      select: {
        name: true,
        role: true,
        department: true,
        teacherProfile: {
          select: {
            dateOfBirth: true,
            designation: true,
          },
        },
        studentProfile: {
          select: {
            dob: true,
            class: true,
          },
        },
      },
    });
    return users;
  }

  async findStudents() {
    const students = await this.prisma.user.findMany({
      where: {
        role: 'parent',
        status: 'active',
      },
      include: {
        studentProfile: true,
      },
    });
    return students.map(this.mapUser);
  }

  async findStudentsByClass(className: string, section: string) {
    const students = await this.prisma.user.findMany({
      where: {
        role: 'parent',
        status: 'active',
        studentProfile: {
          class: className,
          section: section,
        },
      },
      include: {
        studentProfile: true,
      },
    });
    return students.map(this.mapUser);
  }

  async findStudentDetails(id: string) {
    const student = await this.prisma.user.findFirst({
      where: {
        id,
        role: 'parent',
      },
      include: {
        studentProfile: true,
      },
    });
    return student ? this.mapUser(student) : null;
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      include: {
        teacherProfile: true,
        studentProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return users.map(this.mapUser);
  }

  async findByIdentifier(identifier: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier.toLowerCase(), mode: 'insensitive' } },
          { phone: { equals: identifier } },
          { studentProfile: { studentId: { equals: identifier, mode: 'insensitive' } } },
          { studentProfile: { admissionNo: { equals: identifier, mode: 'insensitive' } } },
          { studentProfile: { phone: { equals: identifier } } },
          { studentProfile: { fatherContact: { equals: identifier } } },
          { studentProfile: { motherContact: { equals: identifier } } },
          { teacherProfile: { employeeId: { equals: identifier, mode: 'insensitive' } } },
          { teacherProfile: { phone: { equals: identifier } } },
        ],
      },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    });
    return user ? this.mapUser(user) : null;
  }

  /**
   * Find a user by identifier, returning the RAW database record (including password hash).
   * This should ONLY be used internally by AuthService for login/verification.
   * Never expose the result of this method in API responses.
   */
  async findByIdentifierRaw(identifier: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier.toLowerCase(), mode: 'insensitive' } },
          { phone: { equals: identifier } },
          { studentProfile: { studentId: { equals: identifier, mode: 'insensitive' } } },
          { studentProfile: { admissionNo: { equals: identifier, mode: 'insensitive' } } },
          { studentProfile: { phone: { equals: identifier } } },
          { studentProfile: { fatherContact: { equals: identifier } } },
          { studentProfile: { motherContact: { equals: identifier } } },
          { teacherProfile: { employeeId: { equals: identifier, mode: 'insensitive' } } },
          { teacherProfile: { phone: { equals: identifier } } },
        ],
      },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    });
  }

  /**
   * Find a user by ID, returning the RAW database record (including password hash).
   * This should ONLY be used internally by AuthService for password change verification.
   */
  async findByIdRaw(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { studentProfile: true, teacherProfile: true },
    });
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { studentProfile: true, teacherProfile: true },
    });
    return user ? this.mapUser(user) : null;
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { studentProfile: true, teacherProfile: true },
    });
    return user ? this.mapUser(user) : null;
  }

  async updatePassword(id: string, newPassword: string): Promise<boolean> {
    try {
      const hashedPassword = await PasswordUtils.hashPassword(newPassword);
      await this.prisma.user.update({
        where: { id },
        data: { password: hashedPassword },
      });
      return true;
    } catch {
      return false;
    }
  }

  async updateProfile(
    id: string,
    data: { name?: string; email?: string },
  ): Promise<boolean> {
    try {
      await this.prisma.user.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.email && { email: data.email.toLowerCase() }),
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  async updateStudentProfileFields(
    userId: string,
    data: {
      mobile?: string;
      fatherMobile?: string;
      motherMobile?: string;
      address?: string;
      guardianMobile?: string;
    },
  ): Promise<boolean> {
    try {
      const profile = await this.prisma.studentProfile.findUnique({ where: { userId } });
      if (!profile) return false;
      await this.prisma.studentProfile.update({
        where: { userId },
        data: {
          ...(data.mobile && { phone: data.mobile }),
          ...(data.fatherMobile && { fatherContact: data.fatherMobile }),
          ...(data.motherMobile && { motherContact: data.motherMobile }),
          ...(data.address && { address: data.address, fatherOfficeAddress: data.address }),
          ...(data.guardianMobile && !data.mobile && { phone: data.guardianMobile }),
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      // Delete associated records first to avoid foreign key constraints
      await this.prisma.teacherProfile.deleteMany({ where: { userId: id } });
      await this.prisma.studentProfile.deleteMany({ where: { userId: id } });
      await this.prisma.groupMember.deleteMany({ where: { userId: id } });
      
      await this.prisma.user.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error('Delete user error:', error);
      return false;
    }
  }

  async updateRole(id: string, role: string): Promise<boolean> {
    try {
      await this.prisma.user.update({
        where: { id },
        data: { role: role.toLowerCase() as any },
      });
      return true;
    } catch {
      return false;
    }
  }

  async updateStatus(id: string, status: string, reason?: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { status: status as any },
    });

    if (user.role === 'parent' && reason) {
      await this.prisma.studentProfile.updateMany({
        where: { userId: id },
        data: { inactiveReason: reason },
      });
    }

    return user;
  }

  private generatePassword(): string {
    return PasswordUtils.generateSecurePassword(10);
  }

  private async generateId(prefix: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.user.count({
      where: { role: prefix === 'TCH' ? 'teacher' : 'parent' }
    });
    const sequence = (count + 1).toString().padStart(4, '0');
    return `${prefix}-${year}-${sequence}`;
  }

  async createTeacher(data: {
    name: string;
    email: string;
    department: string;
    designation: string;
    specialization: string;
    phone?: string;
    employeeId?: string;
    password?: string;
    dateOfBirth?: string;
    weddingDate?: string;
  }) {
    const autoId = data.employeeId || await this.generateId('TCH');
    const autoPassword = data.password || this.generatePassword();
    const hashedPassword = await PasswordUtils.hashPassword(autoPassword);

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        password: hashedPassword,
        role: 'teacher',
        department: data.department,
        status: 'active',
        teacherProfile: {
          create: {
            employeeId: autoId,
            designation: data.designation,
            specialization: data.specialization,
            phone: data.phone,
            dateOfBirth: data.dateOfBirth,
            weddingDate: data.weddingDate,
          },
        },
      },
    });

    // Return user with the plaintext password for admin to share (only time it's visible)
    return { ...user, generatedPassword: autoPassword };
  }

  async createStudent(data: any) {
    const autoId = await this.generateId('STU');
    const autoPassword = data.password || this.generatePassword();
    const hashedPassword = await PasswordUtils.hashPassword(autoPassword);
    const autoAdmNo = await this.generateId('ADM');

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        password: hashedPassword,
        role: 'parent',
        department: data.department,
        status: 'active',
        studentProfile: {
          create: {
            studentId: autoId,
            class: data.class,
            section: data.section,
            phone: data.phone || data.fatherContact || data.motherContact,
            admissionNo: autoAdmNo,
            applicationNo: data.applicationNo || `APP-${Date.now()}`,
            gender: data.gender,
            dob: data.dob,
            birthCertNo: data.birthCertNo,
            nationality: data.nationality,
            religion: data.religion,
            community: data.community,
            bloodGroup: data.bloodGroup,
            presentSchool: data.presentSchool,
            previousGrade: data.previousGrade,
            boardOfEducation: data.boardOfEducation,
            motherTongue: data.motherTongue,
            fatherName: data.fatherName,
            fatherContact: data.fatherContact,
            fatherEmail: data.fatherEmail,
            fatherEducation: data.fatherEducation,
            fatherOccupation: data.fatherOccupation,
            fatherOrganization: data.fatherOrganization,
            fatherDesignation: data.fatherDesignation,
            fatherOfficeAddress: data.fatherOfficeAddress,
            motherName: data.motherName,
            motherContact: data.motherContact,
            motherEmail: data.motherEmail,
            motherEducation: data.motherEducation,
            motherOccupation: data.motherOccupation,
            motherOrganization: data.motherOrganization,
            motherDesignation: data.motherDesignation,
            motherOfficeAddress: data.motherOfficeAddress,
            address: data.address,
          },
        },
      },
      include: {
        studentProfile: true
      }
    });

    // Return user with the plaintext password for admin to share (only time it's visible)
    return { ...user, generatedPassword: autoPassword };
  }
  async bulkUpdateStudentClass(userIds: string[], newClass: string, newSection: string) {
    if (!userIds || userIds.length === 0) return { updated: 0 };
    const result = await this.prisma.studentProfile.updateMany({
      where: { userId: { in: userIds } },
      data: { class: newClass, section: newSection },
    });
    return { updated: result.count };
  }

  async getNextStudentIds() {
    const studentId = await this.generateId('STU');
    const admissionNo = await this.generateId('ADM');
    return { studentId, admissionNo };
  }

  /**
   * Maps a raw database user to the AuthUser type.
   * NOTE: Password is intentionally excluded from the mapped output.
   * For internal auth operations that need the password hash,
   * use findByIdentifier/findById which return raw DB records.
   */
  private mapUser(user: any): AuthUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.toLowerCase() as any,
      department: user.department,
      status: user.status.toLowerCase() as any,
      studentProfile: user.studentProfile,
      teacherProfile: user.teacherProfile,
    };
  }
}

