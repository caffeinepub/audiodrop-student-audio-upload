import { createRouter, RouterProvider, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import StudentUploadPage from './pages/StudentUploadPage';
import SubmissionSuccessPage from './pages/SubmissionSuccessPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import SubmissionDetailsPage from './pages/admin/SubmissionDetailsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AuditLogPage from './pages/admin/AuditLogPage';
import AdminRouteGuard from './components/AdminRouteGuard';
import AppShell from './components/AppShell';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';

const rootRoute = createRootRoute({
  component: () => (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AppShell>
        <Outlet />
      </AppShell>
      <Toaster />
    </ThemeProvider>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: StudentUploadPage,
});

const successRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/success',
  component: SubmissionSuccessPage,
});

const adminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/login',
  component: AdminLoginPage,
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/dashboard',
  component: () => (
    <AdminRouteGuard>
      <AdminDashboardPage />
    </AdminRouteGuard>
  ),
});

const adminSubmissionDetailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/submissions/$submissionId',
  component: () => (
    <AdminRouteGuard>
      <SubmissionDetailsPage />
    </AdminRouteGuard>
  ),
});

const adminSettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/settings',
  component: () => (
    <AdminRouteGuard>
      <AdminSettingsPage />
    </AdminRouteGuard>
  ),
});

const adminAuditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/audit',
  component: () => (
    <AdminRouteGuard>
      <AuditLogPage />
    </AdminRouteGuard>
  ),
});

const adminAuditLogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/audit-log',
  component: () => (
    <AdminRouteGuard>
      <AuditLogPage />
    </AdminRouteGuard>
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  successRoute,
  adminLoginRoute,
  adminDashboardRoute,
  adminSubmissionDetailsRoute,
  adminSettingsRoute,
  adminAuditRoute,
  adminAuditLogRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
