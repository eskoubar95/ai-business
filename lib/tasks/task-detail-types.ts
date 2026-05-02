/** Types shared by task detail sidebar, activity feed, and server-fed props mapping. */

export type LogEntry = {
  id: string;
  authorType: string;
  authorId: string | null;
  content: string;
  createdAt: Date;
};

export type TaskRelationItem = {
  id: string;
  relationType: string;
  linkedTaskId: string;
  linkedTaskTitle: string;
  linkedTaskStatus: string;
};
