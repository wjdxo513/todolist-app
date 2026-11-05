import { Router } from 'express';
import * as c from '../controllers/todos.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { idParams } from '../validators/common.schemas.js';
import {
  calendarQuery,
  completionBody,
  listQuery,
  todoCreateBody,
  todoUpdateBody,
} from '../validators/todos.schemas.js';

export const todosRouter = Router();
todosRouter.get('/', requireAuth, validate({ query: listQuery }), c.list);
todosRouter.get('/calendar', requireAuth, validate({ query: calendarQuery }), c.calendar);
todosRouter.post('/', requireAuth, validate({ body: todoCreateBody }), c.create);
todosRouter.get('/:id', requireAuth, validate({ params: idParams }), c.get);
todosRouter.put(
  '/:id',
  requireAuth,
  validate({ params: idParams, body: todoUpdateBody }),
  c.update,
);
todosRouter.patch(
  '/:id/completion',
  requireAuth,
  validate({ params: idParams, body: completionBody }),
  c.setCompletion,
);
todosRouter.delete('/:id', requireAuth, validate({ params: idParams }), c.remove);
