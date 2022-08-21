import { ResultType } from '../lib/Result';
import { TelegramSendMessageParams } from '../telegram';

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
  isStartingSlashOptional?: boolean;
};

export type ValidateResponseOk = {
  textSanitised: string | null;
};

export type ValidateResponseError = {
  errorMessage: string;
};

export type BotResponse = {
  message?: string;
  messageParams?: TelegramSendMessageParams;
  choices?: string[] | undefined;
};

export type BotResponseForCallback = BotResponse & {
  editMessageId: number;
};

export type ServiceResponse = ResultType<BotResponse, void>;
export type ServiceCallbackResponse = ResultType<
  BotResponseForCallback,
  string | void
>;
