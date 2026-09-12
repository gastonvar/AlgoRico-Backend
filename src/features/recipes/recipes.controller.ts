import type { Request, Response } from 'express';
import { createRecipe, deleteRecipe, getRecipe, listRecipes, updateRecipe } from './recipes.service.js';

export async function list(req: Request, res: Response): Promise<void> {
  const result = await listRecipes(req.query as never);
  res.status(200).json(result);
}

export async function create(req: Request, res: Response): Promise<void> {
  const recipe = await createRecipe(req.body);
  res.status(201).json({ data: recipe });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const recipe = await getRecipe(req.params.recipeId as string);
  res.status(200).json({ data: recipe });
}

export async function update(req: Request, res: Response): Promise<void> {
  const recipe = await updateRecipe(req.params.recipeId as string, req.body);
  res.status(200).json({ data: recipe });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await deleteRecipe(req.params.recipeId as string);
  res.status(204).send();
}
