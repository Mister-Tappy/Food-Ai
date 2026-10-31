import type { ModelStatus } from "../types";

// Set VITE_API_URL in .env to point at the deployed Render backend.
//
// Restaurant discovery uses only the OpenStreetMap client in `osmPlaces.ts`.
// This small client is reserved for the optional model administration tools.
const API_URL = import.meta.env.VITE_API_URL as string | undefined;

async function tryFetch<T>(path: string, options?: RequestInit): Promise<T | null> {
  if (!API_URL) return null;
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const api = {
  async triggerTrain(): Promise<{ started: boolean }> {
    const live = await tryFetch<{ started: boolean }>("/train", { method: "POST" });
    return live ?? { started: false };
  },

  async getModelStatus(): Promise<ModelStatus> {
    const live = await tryFetch<ModelStatus>("/model/status");
    return (
      live ?? {
        trained: false,
        lastTrainedAt: null,
        validationMae: null,
        datasetRows: 0,
      }
    );
  },

  isLive(): boolean {
    return Boolean(API_URL);
  },
};
