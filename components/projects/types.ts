export type ProjectStatusV = "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";
export type TaskStatusV = "TODO" | "DOING" | "DONE";
export type SectionTypeV = "HARDWARE" | "SOFTWARE" | "PROJECT_MGMT" | "OTHER";

export type ProjectMemberDTO = { id: string; role: "OWNER" | "MEMBER"; user: { id: string; name: string } };

export type ProjectListItemDTO = {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatusV;
  isPersonal: boolean;
  members: ProjectMemberDTO[];
  taskCounts: { total: number; done: number };
};

export type ProjectTaskDTO = {
  id: string;
  title: string;
  status: TaskStatusV;
  assignee: { id: string; name: string } | null;
};

export type ProjectUpdateDTO = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string } | null;
};

export type ProjectSectionDTO = {
  id: string;
  name: string;
  type: SectionTypeV;
  tasks: ProjectTaskDTO[];
  updates: ProjectUpdateDTO[];
};

export type ProjectDetailDTO = {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatusV;
  isPersonal: boolean;
  createdBy: { id: string; name: string } | null;
  members: ProjectMemberDTO[];
  sections: ProjectSectionDTO[];
};
