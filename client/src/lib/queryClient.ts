import { QueryClient } from '@tanstack/react-query';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage: string;
    try {
      const data = await res.json();
      errorMessage = data.message || `Server responded with ${res.status}`;
    } catch (e) {
      errorMessage = `Server responded with ${res.status}`;
    }
    throw new Error(errorMessage);
  }
}

export async function apiRequest(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: any
) {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  return fetch(path, options);
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn = <T>(options: {
  on401: UnauthorizedBehavior;
}) => {
  return async ({ queryKey }: { queryKey: (string)[] }) => {
    const [path] = queryKey;
    const res = await fetch(path);

    if (res.status === 401) {
      if (options.on401 === "returnNull") {
        return undefined as T;
      } else {
        await throwIfResNotOk(res);
      }
    }

    await throwIfResNotOk(res);
    return res.json() as Promise<T>;
  };
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});