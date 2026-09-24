import type { Request, Response } from 'express';
import { currentCompanyId } from '../../middleware/auth.js';
import {
  createIngredient,
  deleteIngredient,
  getIngredient,
  listIngredients,
  updateIngredient,
} from './ingredients.service.js';

export async function list(req: Request, res: Response): Promise<void> {
  const result = await listIngredients(currentCompanyId(req), req.query as never);
  res.status(200).json(result);
}

export async function create(req: Request, res: Response): Promise<void> {
  const ingredient = await createIngredient(currentCompanyId(req), req.body);
  res.status(201).json({ data: ingredient });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const ingredient = await getIngredient(req.params.ingredientId as string, currentCompanyId(req));
  res.status(200).json({ data: ingredient });
}

export async function update(req: Request, res: Response): Promise<void> {
  const ingredient = await updateIngredient(
    req.params.ingredientId as string,
    currentCompanyId(req),
    req.body,
  );
  res.status(200).json({ data: ingredient });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await deleteIngredient(req.params.ingredientId as string, currentCompanyId(req));
  res.status(204).send();
}
