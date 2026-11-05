import * as categoriesService from '../services/categories.service.js';

export async function list(req, res) {
  res.json(await categoriesService.list(req.userId));
}

export async function create(req, res) {
  res.status(201).json(await categoriesService.create(req.userId, req.body.name));
}

export async function rename(req, res) {
  res.json(await categoriesService.rename(req.userId, req.params.id, req.body.name));
}

export async function remove(req, res) {
  await categoriesService.remove(req.userId, req.params.id);
  res.status(204).end();
}
