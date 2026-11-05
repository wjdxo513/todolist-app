import { Router } from 'express';
import * as c from '../controllers/categories.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { categoryBody } from '../validators/categories.schemas.js';
import { idParams } from '../validators/common.schemas.js';

export const categoriesRouter = Router();
categoriesRouter.get('/categories', requireAuth, c.list);
categoriesRouter.post('/categories', requireAuth, validate({ body: categoryBody }), c.create);
categoriesRouter.patch(
  '/categories/:id',
  requireAuth,
  validate({ params: idParams, body: categoryBody }),
  c.rename,
);
categoriesRouter.delete('/categories/:id', requireAuth, validate({ params: idParams }), c.remove);
