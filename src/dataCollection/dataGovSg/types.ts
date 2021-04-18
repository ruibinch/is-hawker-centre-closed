export type DataGovSgResponse = {
  help: string;
  success: boolean;
  result: {
    resource_id: string;
    fields: Field[];
    records: Record[];
    limit: number;
    total: number;
  };
};

type Field = {
  type: string;
  id: string;
};

export type Record = {
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
