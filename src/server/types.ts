export type BaseQueryParams = {
  page?: number;
  size?: number;
};

export type GetInputsParams = BaseQueryParams & {
  fromDate?: string;
  toDate?: string;
  userId?: number;
};
