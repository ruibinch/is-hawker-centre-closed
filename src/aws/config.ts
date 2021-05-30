import * as AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

export const initAWSConfig = (): void => {
  AWS.config.update({
    // reads from .env file
    region: process.env.REGION,
  });
};

// reads from .env file
export const TABLE_NAME_CLOSURES = process.env.TABLE_NAME_CLOSURES ?? '';
export const TABLE_NAME_HC = process.env.TABLE_NAME_HC ?? '';
export const TABLE_NAME_USERS = process.env.TABLE_NAME_USERS ?? '';
export const TABLE_NAME_FEEDBACK = process.env.TABLE_NAME_FEEDBACK ?? '';

// reads from env vars defined in serverless.yml
export const TABLE_CLOSURES = process.env.TABLE_CLOSURES ?? `${TABLE_NAME_CLOSURES}-dev`;
export const TABLE_HC = process.env.TABLE_HC ?? `${TABLE_NAME_HC}-dev`;
export const TABLE_USERS = process.env.TABLE_USERS ?? `${TABLE_NAME_USERS}-dev`;
export const TABLE_FEEDBACK = process.env.TABLE_FEEDBACK ?? `${TABLE_NAME_FEEDBACK}-dev`;
