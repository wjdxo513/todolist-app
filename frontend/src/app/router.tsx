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
import { RouteError } from './RouteError';

export const routes: RouteObject[] = [
  {
    // 하위 어느 화면에서 예외가 나도 대체 화면 표시
    errorElement: <RouteError />,
    children: [
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
    ],
  },
];
