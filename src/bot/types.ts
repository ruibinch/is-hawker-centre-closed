import { Module } from '../utils/types';

export type Command = {
  module: Module;
  endpoint: string;
  hasExplanation: boolean;
  description: string;
};

export type ValidateInputMessageResponse =
  | {
      success: true;
      textSanitised: string;
    }
  | {
      success: false;
      errorMessage: string;
    };
