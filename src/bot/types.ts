import { Module } from '../utils/types';

export type Command = {
  module: Module;
  endpoint: string;
  hasExplanation: boolean;
  description: string;
};

export type ValidateResponseOk = {
  textSanitised: string | null;
};

export type ValidateResponseError = {
  errorMessage: string;
};
