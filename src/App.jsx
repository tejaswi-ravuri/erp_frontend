import { Toaster } from "sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { RoleProvider, useRole } from "@/lib/RoleContext";

import RoleLogin from "@/pages/RoleLogin";
import RoleLayout from "@/components/layout/RoleLayout";
import RoleRoute from "@/components/RoleRoute";

// Role-specific dashboards
import FinanceDashboard from "@/pages/dashboards/FinanceDashboard";
import TeacherDashboard from "@/pages/dashboards/TeacherDashboard";
import PrincipalDashboard from "@/pages/dashboards/PrincipalDashboard";
import AccountsManagerDashboard from "./pages/dashboards/AccountsManagerDashboard";
import AdmissionEnquiry from "@/pages/AdmissionEnquiry";
import AdmissionForm from "@/pages/OpenAdmissionForm";
import ApplicationForm from "@/pages/ApplicationForm";
import MultiReceipts from "@/pages/MultiReceipts";
import DuplicateReceipt from "@/pages/DuplicateReceipts";
import IncomeCancellationRequest from "@/pages/IncomeCancellationRequest";

// New pages
import HallTicket from "@/pages/HallTicket";
import HomeworkManager from "@/pages/HomeworkManager";
import StudentPortal from "@/pages/StudentPortal";

// Shared pages
import BPAdmissions from "@/pages/BPAdmissions";
import BPStudents from "@/pages/BPStudents";
import BPStaff from "@/pages/BPStaff";
import BPClasses from "@/pages/BPClasses";
import BPAttendance from "@/pages/BPAttendance";
import BPMarks from "@/pages/BPMarks";
import BPFees from "@/pages/BPFees";
import BPExpenditure from "@/pages/BPExpenditure";
import BPAccounts from "@/pages/BPAccounts";
import StudentFeeReport from "@/pages/StudentFeeReport";
import BPAnalytics from "@/pages/BPAnalytics";
import BPReportCard from "@/pages/BPReportCard";
import BPTrackingExpenses from "@/pages/BPTrackingExpenses";
import BusFeeReport from "@/pages/BusFeeReport";
import StudentReceipt from "@/pages/StudentReceipt";
import TeacherForm from "@/pages/TeacherForm";
import BPIncome from "./pages/BPIncome";
import BPBranches from "@/pages/BPBranches";

const DASHBOARDS = {
  finance: FinanceDashboard,
  teacher: TeacherDashboard,
  principal: PrincipalDashboard,
  consultant: AccountsManagerDashboard,
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, user } = useAuth();
  const { activeRole } = useRole();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#080c14]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-900 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading MasterMinds ERP...</p>
        </div>
      </div>
    );
  }

  if (!user || !activeRole) {
    return (
      <Routes>
        <Route path="/" element={<RoleLogin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Student gets their own standalone portal
  if (activeRole === "student") {
    return (
      <Routes>
        <Route path="*" element={<StudentPortal />} />
      </Routes>
    );
  }

  const HomeDashboard = DASHBOARDS[activeRole] || FinanceDashboard;

  return (
    <Routes>
      <Route element={<RoleLayout user={user} />}>
        <Route element={<RoleRoute />}>
          <Route path="/" element={<HomeDashboard />} />
          <Route path="/admissions" element={<BPAdmissions />} />
          <Route path="/admissions/enquiry" element={<AdmissionEnquiry />} />
          <Route
            path="/admissions/admission-form"
            element={<AdmissionForm />}
          />
          <Route
            path="/admissions/applications"
            element={<ApplicationForm />}
          />
          <Route path="/students" element={<BPStudents />} />
          <Route path="/staff" element={<BPStaff />} />
          <Route path="/classes" element={<BPClasses />} />
          <Route path="/attendance" element={<BPAttendance />} />
          <Route path="/marks" element={<BPMarks />} />
          <Route path="/fees" element={<BPFees />} />
          <Route
            path="/fees/duplicate-receipts"
            element={<DuplicateReceipt />}
          />
          <Route path="/expenditure" element={<BPExpenditure />} />
          <Route path="/accounts" element={<BPAccounts />} />
          <Route path="/branches" element={<BPBranches />} />
          <Route path="/student-fee-report" element={<StudentFeeReport />} />
          <Route path="/analytics" element={<BPAnalytics />} />
          <Route path="/report-cards" element={<BPReportCard />} />
          <Route path="/financial-report" element={<BPTrackingExpenses />} />
          <Route path="/bus-fee-report" element={<BusFeeReport />} />
          <Route path="/student-receipt" element={<StudentReceipt />} />
          <Route path="/hall-ticket" element={<HallTicket />} />
          <Route path="/homework-manager" element={<HomeworkManager />} />
          <Route path="/income" element={<BPIncome />} />
          <Route path="/income/multi-receipts" element={<MultiReceipts />} />
          <Route
            path="/income/cancellation-receipt"
            element={<IncomeCancellationRequest />}
          />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <RoleProvider>
          <Router>
            <Routes>
              <Route path="/teacher-registration" element={<TeacherForm />} />
              {/* Everything else goes through the normal login-gated app. */}
              <Route path="/*" element={<AuthenticatedApp />} />
            </Routes>
          </Router>
          <Toaster />
        </RoleProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
