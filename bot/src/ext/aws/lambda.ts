import type { APIGatewayProxyResult, Callback } from 'aws-lambda';

type ResponseBody = {
  statusCode: number;
  body: string;
};

export const makeCallbackWrapper =
  (callback: Callback<APIGatewayProxyResult>) =>
  (statusCode: number, body?: string): ResponseBody => {
    const responseBody: ResponseBody = {
      statusCode,
      body: body ?? '',
    };

    callback(null, responseBody);
    return responseBody;
  };
