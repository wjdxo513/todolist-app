import { Router } from 'express';
import * as c from '../controllers/users.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { changePasswordBody, updateMeBody } from '../validators/users.schemas.js';

export const usersRouter = Router();
usersRouter.get('/users/me', requireAuth, c.getMe);
usersRouter.patch('/users/me', requireAuth, validate({ body: updateMeBody }), c.updateMe);
usersRouter.put(
  '/users/me/password',
  requireAuth,
  validate({ body: changePasswordBody }),
  c.changePassword,
);
