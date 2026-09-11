import type { Request, Response } from 'express';
import { currentUserId } from '../../middleware/auth.js';
import { createTask, deleteTask, getTask, listTasks, updateTask } from './tasks.service.js';

export async function list(req: Request, res: Response): Promise<void> {
  const result = await listTasks(req.query as never);
  res.status(200).json(result);
}

export async function create(req: Request, res: Response): Promise<void> {
  const task = await createTask(currentUserId(req), req.body);
  res.status(201).json({ data: task });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const task = await getTask(req.params.taskId as string);
  res.status(200).json({ data: task });
}

export async function update(req: Request, res: Response): Promise<void> {
  const task = await updateTask(req.params.taskId as string, req.body);
  res.status(200).json({ data: task });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await deleteTask(req.params.taskId as string);
  res.status(204).send();
}
