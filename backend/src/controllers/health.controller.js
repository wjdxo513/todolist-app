import * as healthService from '../services/health.service.js';

export async function getHealth(req, res) {
  res.json(await healthService.check());
}
