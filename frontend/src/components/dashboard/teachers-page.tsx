"use client";

import { useCallback } from "react";
import { useAuthResource } from "../../hooks/use-auth-resource";
import { getAllUsers } from "../../services/users-service";
import { DataTable } from "./data-table";
import { MetricCard } from "./metric-card";
import { PageSection } from "./page-section";
import { ResourceError, ResourceLoading } from "./resource-states";

export function TeachersPage() {
  const loadTeachers = useCallback(
    async (accessToken: string) => {
      const users = await getAllUsers() as any[];
      const teachers = users.filter(u => u.role === 'teacher');
      
      return {
        summary: {
          total: teachers.length,
          active: teachers.filter(t => t.status === 'active').length,
          overloaded: 0
        },
        departments: Array.from(new Set(teachers.map(t => t.department))).map(dept => ({
          name: dept || 'Unassigned',
          teachers: teachers.filter(t => t.department === dept).length
        })),
        teachers: teachers.map(t => ({
          id: t.teacherProfile?.employeeId || t.id.substring(0,8),
          name: t.name,
          department: t.department || 'N/A',
          subjects: [t.teacherProfile?.specialization || 'N/A'],
          workload: 'N/A',
          status: t.status
        }))
      };
    },
    [],
  );
  const { data, error, isLoading } = useAuthResource(loadTeachers);

  return (
    <PageSection
      eyebrow="Teachers"
      title="Teacher management"
      description="This mock view gives your team a working teacher list, department distribution, and workload picture until full CRUD and Prisma models land."
    >
      {isLoading ? <ResourceLoading label="teachers" /> : null}
      {error ? <ResourceError label="teachers" message={error} /> : null}
      {data ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Total teachers" value={String(data.summary.total)} />
            <MetricCard label="Active today" value={String(data.summary.active)} />
            <MetricCard
              label="Workload alerts"
              value={String(data.summary.overloaded)}
            />
          </div>
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-[1.6rem] border border-[var(--border)] bg-[var(--bg-secondary)] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Department distribution
              </h2>
              <div className="mt-5 space-y-4">
                {data.departments.map((department) => (
                  <div
                    key={department.name}
                    className="flex items-center justify-between rounded-[1.2rem] border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3"
                  >
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {department.name}
                    </span>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      {department.teachers}
                    </span>
                  </div>
                ))}
              </div>
            </section>
            <DataTable
              columns={["ID", "Name", "Department", "Subjects", "Workload", "Status"]}
              rows={data.teachers.map((teacher) => [
                teacher.id,
                teacher.name,
                teacher.department,
                teacher.subjects.join(", "),
                teacher.workload,
                teacher.status,
              ])}
            />
          </div>
        </>
      ) : null}
    </PageSection>
  );
}
