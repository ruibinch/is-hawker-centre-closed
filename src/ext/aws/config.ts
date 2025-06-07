import dotenv from 'dotenv';

dotenv.config();

export const awsConfig = {
  region: process.env.REGION,
};

// reads from .env file
export const TABLE_CLOSURES = process.env.TABLE_CLOSURES ?? '';
export const TABLE_HC = process.env.TABLE_HC ?? '';
export const TABLE_USERS = process.env.TABLE_USERS ?? '';
export const TABLE_FEEDBACK = process.env.TABLE_FEEDBACK ?? '';
export const TABLE_INPUTS = process.env.TABLE_INPUTS ?? '';
