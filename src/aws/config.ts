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
