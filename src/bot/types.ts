import { ResultType } from '../lib/Result';

export type Module =
  | 'search'
  | 'favourites'
  | 'language'
  | 'feedback'
  | 'general';

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

export type BotResponse = {
  message: string;
  choices?: string[] | undefined;
};

export type ServiceResponse = ResultType<BotResponse, void>;
