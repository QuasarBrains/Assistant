export type FetchRequest = (...args: any[]) => Promise<{ [key: string]: any }>;

export type DefaultResponse<B> = {
  data: B;
  success: boolean;
  message: string;
  retrained?: boolean;
  xw;
  error?: string;
};
