'use client';

import useSWR from 'swr';
import type { Agent, AgentWithStatus, CreateAgentRequest, UpdateAgentRequest } from '@shared/types/agent';
import { agentAPI } from '@/lib/api';

const AGENTS_KEY = '/agents';

export function useAgents() {
  const { data, error, isLoading, mutate } = useSWR(
    AGENTS_KEY,
    () => agentAPI.getAll(),
    {
      refreshInterval: 5000,
    }
  );

  return {
    agents: data?.agents || [],
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useAgent(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `${AGENTS_KEY}/${id}` : null,
    () => agentAPI.getById(id),
    {
      refreshInterval: 3000,
    }
  );

  return {
    agent: data?.agent,
    isLoading,
    isError: !!error,
    mutate,
  };
}

export async function createAgent(data: CreateAgentRequest) {
  return agentAPI.create(data);
}

export async function updateAgent(id: string, data: UpdateAgentRequest) {
  return agentAPI.update(id, data);
}

export async function deleteAgent(id: string) {
  return agentAPI.delete(id);
}
