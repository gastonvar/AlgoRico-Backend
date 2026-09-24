import type { Request, Response } from 'express';
import { currentCompanyId } from '../../middleware/auth.js';
import { createRecipe, deleteRecipe, getRecipe, listRecipes, updateRecipe } from './recipes.service.js';

export async function list(req: Request, res: Response): Promise<void> {
  const result = await listRecipes(currentCompanyId(req), req.query as never);
  res.status(200).json(result);
}

export async function create(req: Request, res: Response): Promise<void> {
  const recipe = await createRecipe(currentCompanyId(req), req.body);
  res.status(201).json({ data: recipe });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const recipe = await getRecipe(req.params.recipeId as string, currentCompanyId(req));
  res.status(200).json({ data: recipe });
}

export async function update(req: Request, res: Response): Promise<void> {
  const recipe = await updateRecipe(req.params.recipeId as string, currentCompanyId(req), req.body);
  res.status(200).json({ data: recipe });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await deleteRecipe(req.params.recipeId as string, currentCompanyId(req));
  res.status(204).send();
}
