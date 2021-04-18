type DataGovSGResponseBase = {
  help: string;
  success: boolean;
};

type Field = {
  type: string;
  id: string;
};

// Hawker centre closure details

export type HawkerCentreClosureResponse = DataGovSGResponseBase & {
  result: {
    resource_id: string;
    fields: Field[];
    records: HawkerCentreClosureRecord[];
    limit: number;
    total: number;
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
};
