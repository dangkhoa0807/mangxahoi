export interface ApiResponse<T = undefined> {
  code: number;
  data: T;
  message?: string;
}
