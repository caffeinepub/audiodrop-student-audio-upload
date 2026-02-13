import { createRouter, RouterProvider, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { useEffect } from 'react';
import { toast } from 'sonner';
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
import { checkHealth } from './ic/actor';
import { getBackendCanisterId } from './config/canisters';

function RootLayout() {
  useEffect(() => {
    // Perform automatic health check on app load with enhanced diagnostics
    const performHealthCheck = async () => {
      const canisterId = getBackendCanisterId();
      
      try {
        console.log('[App] Performing initial backend health check...');
        console.log('[App] Using canister ID:', canisterId);
        
        const result = await checkHealth();
        
        if (!result.online) {
          console.error('[App] Backend health check failed:', result.error);
          toast.error('Backend connection issue', {
            description: `${result.error || 'Unable to connect to backend'}`,
            duration: 10000,
          });
        } else {
          console.log('[App] ✓ Backend health check passed - application ready');
        }
      } catch (error) {
        console.error('[App] Health check error:', error);
        toast.error('Backend connection error', {
          description: `Failed to verify backend connectivity (Canister: ${canisterId})`,
          duration: 10000,
        });
      }
    };

    performHealthCheck();
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AppShell>
        <Outlet />
      </AppShell>
      <Toaster />
    </ThemeProvider>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
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
