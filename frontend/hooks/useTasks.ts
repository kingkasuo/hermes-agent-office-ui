'use client';

import useSWR from 'swr';
import type { Task, CreateTaskRequest } from '@shared/types/task';
import { taskAPI } from '@/lib/api';

const TASKS_KEY = '/tasks';

export function useTasks() {
  const { data, error, isLoading, mutate } = useSWR(
    TASKS_KEY,
    () => taskAPI.getAll(),
    {
      refreshInterval: 5000,
    }
  );

  return {
    tasks: data?.tasks || [],
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useTask(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `${TASKS_KEY}/${id}` : null,
    () => taskAPI.getById(id)
  );

  return {
    task: data?.task,
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useTaskStats() {
  const { data, error, isLoading } = useSWR(
    `${TASKS_KEY}/stats`,
    () => taskAPI.getStats(),
    {
      refreshInterval: 10000,
    }
  );

  return {
    stats: data,
    isLoading,
    isError: !!error,
  };
}

export async function createTask(data: CreateTaskRequest) {
  return taskAPI.create(data);
}

export async function updateTask(id: string, data: Partial<Task>) {
  return taskAPI.update(id, data);
}
