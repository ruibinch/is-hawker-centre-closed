import { Module } from '../common/types';

export type Command = {
  module: Module;
  endpoint: string;
  hasExplanation: boolean;
  description: string;
};
