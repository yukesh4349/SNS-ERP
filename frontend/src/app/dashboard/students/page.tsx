"use client";

import { StudentDirectoryPage } from "../../../components/dashboard/student-directory-page";
import { DashboardLayoutShell } from "../../../components/dashboard/dashboard-layout-shell";

export default function StudentsRoute() {
  return (
    <DashboardLayoutShell>
      <StudentDirectoryPage />
    </DashboardLayoutShell>
  );
}
