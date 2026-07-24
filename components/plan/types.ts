export type PlanCategory = { id: string; name: string; color: string; active: boolean };
export type PlanStatusOpt = { id: string; name: string; color: string; order: number; isDefault: boolean };

export type PlanColumnTypeV = "TEXT" | "DATE" | "NUMBER" | "SELECT" | "MULTI_SELECT";
export type PlanColumnOptionDTO = { id: string; name: string; color: string };
export type PlanColumnDTO = {
  id: string;
  name: string;
  type: PlanColumnTypeV;
  options: PlanColumnOptionDTO[];
};

export type PlanItemValueDTO = {
  columnId: string;
  textValue: string | null;
  dateValue: string | null; // ISO date
  numberValue: number | null;
  optionIds: string[];
};

export type PlanItemDTO = {
  id: string;
  ownerId: string;
  title: string;
  subTag: string | null;
  review: string | null;
  category: PlanCategory | null;
  status: PlanStatusOpt | null;
  values: PlanItemValueDTO[];
};
