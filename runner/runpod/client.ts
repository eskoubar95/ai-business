/**
 * RunPod GraphQL API wrapper (server-side only). Credentials from env — never log API keys.
 */

const DEFAULT_GRAPHQL_URL = "https://api.runpod.io/graphql";

export type RunpodClient = {
  startInstance(): Promise<void>;
  stopInstance(): Promise<void>;
  getStatus(): Promise<{ running: boolean }>;
};

type GraphqlResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

function requireApiKey(): string {
  const key = process.env.RUNPOD_API_KEY?.trim();
  if (!key) {
    throw new Error("RUNPOD_API_KEY is not set");
  }
  return key;
}

function getPodId(): string | null {
  return process.env.RUNPOD_POD_ID?.trim() || null;
}

function getGraphqlUrl(): string {
  return process.env.RUNPOD_GRAPHQL_URL?.trim() || DEFAULT_GRAPHQL_URL;
}

async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const key = requireApiKey();
  const res = await fetch(getGraphqlUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    throw new Error(`RunPod GraphQL HTTP ${res.status}: ${await res.text().catch(() => "")}`);
  }
  const body = (await res.json()) as GraphqlResponse<T>;
  if (body.errors?.length) {
    throw new Error(body.errors.map((e) => e.message).join("; "));
  }
  if (!body.data) {
    throw new Error("RunPod GraphQL returned no data");
  }
  return body.data;
}

/** Real RunPod client; requires RUNPOD_POD_ID for start/stop (otherwise no-ops for local dev). */
export function createRunpodClientFromEnv(): RunpodClient {
  const podId = getPodId();
  if (!podId) {
    return {
      startInstance: async () => {},
      stopInstance: async () => {},
      getStatus: async () => ({ running: false }),
    };
  }

  return {
    async startInstance() {
      const data = await gql<{ podResume: { id: string } }>(
        `mutation PodResume($input: PodResumeInput!) { podResume(input: $input) { id } }`,
        { input: { podId } },
      );
      if (!data.podResume?.id) {
        throw new Error("RunPod podResume returned empty id");
      }
    },
    async stopInstance() {
      const data = await gql<{ podStop: { id: string } }>(
        `mutation PodStop($input: PodStopInput!) { podStop(input: $input) { id } }`,
        { input: { podId } },
      );
      if (!data.podStop?.id) {
        throw new Error("RunPod podStop returned empty id");
      }
    },
    async getStatus() {
      const data = await gql<{ pod: { desiredStatus: string } | null }>(
        `query Pod($input: PodInput!) { pod(input: $input) { desiredStatus } }`,
        { input: { podId } },
      );
      const s = data.pod?.desiredStatus?.toLowerCase() ?? "";
      return { running: s === "running" || s === "active" };
    },
  };
}
