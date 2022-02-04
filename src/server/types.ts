export type BaseQueryParams = {
  page?: number;
  size?: number;
};

export type SearchInputsParams = BaseQueryParams & {
  fromDate?: string;
  toDate?: string;
  userId?: number;
};
