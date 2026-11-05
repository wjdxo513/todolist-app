import * as usersService from '../services/users.service.js';

export async function getMe(req, res) {
  res.json(await usersService.getMe(req.userId));
}

export async function updateMe(req, res) {
  res.json(await usersService.updateName(req.userId, req.body.name));
}

export async function changePassword(req, res) {
  await usersService.changePassword(req.userId, req.body);
  res.status(204).end();
}
