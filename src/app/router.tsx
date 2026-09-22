import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AdminLayout } from '@/presentation/layouts/AdminLayout'
import { DashboardPage } from '@/presentation/pages/DashboardPage'
import { AnatomicalStructuresPage } from '@/presentation/pages/AnatomicalStructuresPage'
import { ExercisesPage } from '@/presentation/pages/ExercisesPage'
import { NotFoundPage } from '@/presentation/pages/NotFoundPage'
import { RouteErrorPage } from '@/presentation/pages/RouteErrorPage'
import { UserAssessmentPage } from '@/presentation/pages/UserAssessmentPage'

export const router = createBrowserRouter([
  {
    path: '/assessment',
    element: <UserAssessmentPage />,
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/',
    element: <AdminLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'anatomical-structures', element: <AnatomicalStructuresPage /> },
      { path: 'exercises', element: <ExercisesPage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
