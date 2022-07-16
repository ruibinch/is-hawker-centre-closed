import type { Closure } from '../models/Closure';
import type { HawkerCentre } from '../models/HawkerCentre';

type DataGovSGResponseBase = {
  help: string;
  success: boolean;
};

type DataGovSGResponseResultBase = {
  resource_id: string;
  fields: Array<{
    type: string;
    id: string;
  }>;
  limit: number;
  total: number;
};

// Hawker centre closure details

export type HawkerCentreClosureResponse = DataGovSGResponseBase & {
  result: DataGovSGResponseResultBase & {
    records: HawkerCentreClosureRecord[];
  };
};

export type HawkerCentreClosureRecord = {
  _id: number;
  name: string;
  address_myenv: string;
  q1_cleaningstartdate: string;
  q1_cleaningenddate: string;
  q2_cleaningstartdate: string;
  q2_cleaningenddate: string;
  q3_cleaningstartdate: string;
  q3_cleaningenddate: string;
  q4_cleaningstartdate: string;
  q4_cleaningenddate: string;
  other_works_startdate: string;
  other_works_enddate: string;
  remarks_other_works: string;
  latitude_hc: string;
  longitude_hc: string;
  google_3d_view: string;
};

// Parsed data

export type NEAData = {
  hawkerCentres: HawkerCentre[];
  closures: Closure[];
};
