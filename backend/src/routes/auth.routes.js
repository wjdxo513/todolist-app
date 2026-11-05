import { Router } from 'express';
import * as c from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.js';
import { loginBody, signupBody } from '../validators/auth.schemas.js';

export const authRouter = Router();
authRouter.post('/auth/signup', validate({ body: signupBody }), c.signUp);
authRouter.post('/auth/login', validate({ body: loginBody }), c.logIn);
authRouter.post('/auth/logout', c.logOut);
authRouter.post('/auth/refresh', c.refresh);
