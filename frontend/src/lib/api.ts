import axios, { AxiosError } from "axios";

const client = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

client.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<{ message?: string | string[] }>) => {
    const raw = error.response?.data?.message;
    const message = Array.isArray(raw)
      ? raw[0]
      : (raw ?? error.message ?? "Erro desconhecido");
    return Promise.reject(new Error(message));
  },
);

export const api = {
  get: <T = unknown>(path: string): Promise<T> => client.get<T, T>(path),
  post: <T = unknown>(path: string, body: unknown): Promise<T> =>
    client.post<T, T>(path, body),
  put: <T = unknown>(path: string, body: unknown): Promise<T> =>
    client.put<T, T>(path, body),
  patch: <T = unknown>(path: string, body: unknown): Promise<T> =>
    client.patch<T, T>(path, body),
  delete: <T = unknown>(path: string): Promise<T> => client.delete<T, T>(path),
};
