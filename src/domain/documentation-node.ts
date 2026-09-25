export type DocumentationNode = Readonly<{
  id: string;
  sourceId: string;
  title: string;
  parentIds: readonly string[];
  hasContent: boolean;
  sourceRef?: string | undefined;
  contentType?: string | undefined;
  position?: number | undefined;
}>;

export type DocumentationDocument = DocumentationNode & Readonly<{
  content: string | null;
}>;

export type AddDocumentationNode = Readonly<{
  title: string;
  parentIds: readonly string[];
  content?: string;
  sourceRef?: string | undefined;
  contentType?: string | undefined;
  position?: number | undefined;
}>;

export type UpdateDocumentationNode = Readonly<{
  id: string;
  title?: string;
  parentIds?: readonly string[];
  content?: string | null;
  sourceRef?: string | null;
  contentType?: string | null;
  position?: number | null;
}>;

export type DocumentationNodePage = Readonly<{
  items: readonly DocumentationNode[];
  nextCursor?: string;
}>;

export type RemoveNodesResult = Readonly<{
  removedNodeIds: readonly string[];
  updatedNodeIds: readonly string[];
}>;
