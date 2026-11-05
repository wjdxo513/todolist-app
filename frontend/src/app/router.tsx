import { Navigate, type RouteObject } from 'react-router';
import { ROUTES } from '../lib/routes';
import { CalendarPage } from '../pages/CalendarPage';
import { CategoriesPage } from '../pages/CategoriesPage';
import { LoginPage } from '../pages/LoginPage';
import { ProfilePage } from '../pages/ProfilePage';
import { SignupPage } from '../pages/SignupPage';
import { TodoFormPage } from '../pages/TodoFormPage';
import { TodoListPage } from '../pages/TodoListPage';
import { AppLayout } from './AppLayout';
import { PublicOnly } from './PublicOnly';
import { RequireAuth } from './RequireAuth';

export const routes: RouteObject[] = [
  {
    element: <PublicOnly />,
    children: [
      { path: ROUTES.signup, element: <SignupPage /> },
      { path: ROUTES.login, element: <LoginPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: ROUTES.todos, element: <TodoListPage /> },
          { path: ROUTES.todoNew, element: <TodoFormPage /> },
          { path: ROUTES.todoEdit(':id'), element: <TodoFormPage /> },
          { path: ROUTES.calendar, element: <CalendarPage /> },
          { path: ROUTES.categories, element: <CategoriesPage /> },
          { path: ROUTES.profile, element: <ProfilePage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to={ROUTES.todos} replace /> },
];
