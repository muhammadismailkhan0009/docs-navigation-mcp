export type DocumentationSource = Readonly<{
  id: string;
  name: string;
  type: string;
  version?: string;
  origin?: string;
}>;

export type DocumentationNode = Readonly<{
  id: string;
  sourceId: string;
  title: string;
  parentIds: readonly string[];
  hasContent: boolean;
  sourceRef?: string;
  contentType?: string;
  position?: number;
}>;

export type DocumentationDocument = DocumentationNode &
  Readonly<{
    content: string | null;
  }>;

export type DocumentationNodePage = Readonly<{
  items: readonly DocumentationNode[];
  nextCursor?: string;
}>;
