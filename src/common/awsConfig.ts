import * as AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

export const initAWSConfig = (): void => {
  AWS.config.update({
    // reads from .env file
    region: process.env.REGION,
  });
};

export const getProvisionedThroughput = (): {
  ReadCapacityUnits: number;
  WriteCapacityUnits: number;
} => ({
  ReadCapacityUnits: 5,
  WriteCapacityUnits: 5,
});

// reads from .env file
export const TABLE_NAME_RESULTS = process.env.TABLE_NAME_RESULTS ?? '';
export const TABLE_NAME_HC = process.env.TABLE_NAME_HC ?? '';
export const TABLE_NAME_USERS = process.env.TABLE_NAME_USERS ?? '';
export const TABLE_NAME_FEEDBACK = process.env.TABLE_NAME_FEEDBACK ?? '';

// reads from env vars defined in serverless.yml
export const TABLE_RESULTS = process.env.TABLE_RESULTS ?? `${TABLE_NAME_RESULTS}-dev`;
export const TABLE_HC = process.env.TABLE_HC ?? `${TABLE_NAME_HC}-dev`;
export const TABLE_USERS = process.env.TABLE_USERS ?? `${TABLE_NAME_USERS}-dev`;
export const TABLE_FEEDBACK = process.env.TABLE_FEEDBACK ?? `${TABLE_NAME_FEEDBACK}-dev`;
