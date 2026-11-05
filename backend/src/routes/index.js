import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { categoriesRouter } from './categories.routes.js';
import { healthRouter } from './health.routes.js';
import { todosRouter } from './todos.routes.js';
import { usersRouter } from './users.routes.js';

export const router = Router();
router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(categoriesRouter);
router.use('/todos', todosRouter);
