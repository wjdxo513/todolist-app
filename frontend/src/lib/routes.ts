// 화면 경로 상수(LP-14)
export const ROUTES = {
  signup: '/signup',
  login: '/login',
  todos: '/todos',
  todoNew: '/todos/new',
  todoEdit: (id: number | string) => `/todos/${id}/edit`,
  calendar: '/calendar',
  categories: '/categories',
  profile: '/profile',
} as const;
