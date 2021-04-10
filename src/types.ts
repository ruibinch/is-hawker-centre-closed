export type ColHeader = 'no' | 'hawkerCentre' | 'startDate' | 'endDate';

export type TextContentItem = {
  str: string;
  dir: string;
  width: number;
  height: number;
  transform: number[];
  fontName: string;
};

export type TextBox = Dimensions & {
  text: string;
};

export type Dimensions = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ResultEntry = {
  hawkerCentre: string;
  startDate: string;
  endDate: string;
};
