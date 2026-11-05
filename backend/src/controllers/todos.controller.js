import * as todosService from '../services/todos.service.js';

export async function create(req, res) {
  res.status(201).json(await todosService.create(req.userId, req.body));
}

export async function get(req, res) {
  res.json(await todosService.get(req.userId, req.params.id));
}

export async function update(req, res) {
  res.json(await todosService.update(req.userId, req.params.id, req.body));
}

export async function setCompletion(req, res) {
  res.json(await todosService.setCompletion(req.userId, req.params.id, req.body.isCompleted));
}

export async function remove(req, res) {
  await todosService.remove(req.userId, req.params.id);
  res.status(204).end();
}

export async function list(req, res) {
  res.json(await todosService.list(req.userId, req.query));
}

export async function calendar(req, res) {
  res.json(await todosService.calendar(req.userId, req.query));
}
