import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AccessPage } from '../features/access/AccessPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { WelcomePage } from '../pages/WelcomePage';
import { PageLoading } from '../components/States';
import { AppShell } from './AppShell';
import { ProtectedRoute } from './ProtectedRoute';

const TodayPage = lazy(() => import('../pages/TodayPage').then((m) => ({ default: m.TodayPage })));
const HistoryPage = lazy(() =>
  import('../pages/HistoryPage').then((m) => ({ default: m.HistoryPage })),
);
const PetPage = lazy(() => import('../pages/PetPage').then((m) => ({ default: m.PetPage })));
const HabitsPage = lazy(() =>
  import('../pages/HabitsPage').then((m) => ({ default: m.HabitsPage })),
);
const HabitFormPage = lazy(() =>
  import('../pages/HabitFormPage').then((m) => ({ default: m.HabitFormPage })),
);
const SettingsPage = lazy(() =>
  import('../pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
const LazyOutlet = () => (
  <Suspense fallback={<PageLoading />}>
    <Outlet />
  </Suspense>
);

export function App() {
  return (
    <Routes>
      <Route path="/w/:slug/:mode" element={<AccessPage />} />
      <Route path="/welcome" element={<WelcomePage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route element={<LazyOutlet />}>
            <Route path="/today" element={<TodayPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/pet" element={<PetPage />} />
            <Route path="/habits" element={<HabitsPage />} />
            <Route path="/habits/new" element={<HabitFormPage />} />
            <Route path="/habits/:id/edit" element={<HabitFormPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/today" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
