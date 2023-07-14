import { useCallback, useEffect, useState } from "react";
import { DefaultResponse } from "../declarations/server";
import { api } from "../utils/axios";

export interface UseFetchConfig<B, D> {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: B;
  onBefore?: () => void;
  onSuccess?: (data: D) => void;
  onError?: (err: unknown) => void;
  onFinally?: () => void;
  headers?: Record<string, string> | undefined;
  query?: Record<string, string> | undefined;
  bustCache?: boolean;
  runOnMount?: boolean;
  dependencies?: unknown[];
  runOnDependencies?: unknown[];
}

function useFetch<B, D>({
  url,
  method = "GET",
  body,
  onBefore,
  onSuccess,
  onError,
  onFinally,
  headers,
  query,
  bustCache,
  runOnMount = false,
  dependencies = [],
  runOnDependencies = [],
}: UseFetchConfig<B, D>) {
  const queryStr = query
    ? Object.keys(query)
        .map((key) => (query[key] ? `${key}=${query[key]}` : ""))
        .join("&")
    : "";

  const urlToUse = queryStr ? `${url}?${queryStr}` : url;

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<D>();
  const [success, setSuccess] = useState(false);

  const useBody = () => {
    if (body instanceof FormData) {
      return body;
    }
    return {
      ...body,
    };
  };

  const load = useCallback(
    async (loadConfig?: { updatedUrl?: string; updatedBody?: B }) => {
      refreshHeaders();
      onBefore && onBefore();
      setLoading(true);
      return api<DefaultResponse<D>>(loadConfig?.updatedUrl || urlToUse, {
        method,
        data: useBody(),
        headers,
        cache: bustCache ? false : undefined,
      })
        .then((res) => {
          onSuccess && onSuccess(res.data.data as D);
          setData(res.data.data);
          setSuccess(true);
          return res.data;
        })
        .catch((err) => {
          onError && onError(err);
          setData(undefined);
          setSuccess(false);
          const message = err?.response?.data?.message || err?.message || null;
          return {
            error: err,
            success: false,
            data: null,
            message,
          } as DefaultResponse<null>;
        })
        .finally(() => {
          setLoading(false);
          onFinally && onFinally();
        });
    },
    [urlToUse, method, body, headers, bustCache, ...dependencies]
  );

  const refreshHeaders = () => {
    api.defaults.headers["Authorization"] = `Bearer ${localStorage.getItem(
      "accessToken"
    )}`;
    api.defaults.headers["x-refresh-token"] =
      localStorage.getItem("refreshToken");
  };

  useEffect(() => {
    if (
      runOnMount ||
      (runOnDependencies.length > 0 && runOnDependencies.every((dep) => !!dep))
    ) {
      refreshHeaders();
      load({
        updatedUrl: urlToUse,
        updatedBody: body,
      });
    }
  }, [
    urlToUse,
    method,
    body,
    headers,
    bustCache,
    runOnMount,
    ...runOnDependencies,
  ]);

  const loadWithUrl = useCallback(
    (url: string) => {
      api<DefaultResponse<D>>(url, {
        method,
        data: {
          ...body,
        },
        headers,
        cache: bustCache ? false : undefined,
      })
        .then((res) => {
          onSuccess && onSuccess(res.data.data as D);
          setData(res.data.data);
          setSuccess(true);
          return res.data;
        })
        .catch((err) => {
          onError && onError(err);
          setData(undefined);
          setSuccess(false);
          return {
            error: err,
            success: false,
            data: null,
          } as DefaultResponse<null>;
        });
    },
    [load]
  );

  return { loading, data, load, success, loadWithUrl };
}

export default useFetch;
