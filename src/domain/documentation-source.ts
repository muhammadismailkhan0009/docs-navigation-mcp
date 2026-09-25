export type DocumentationSource = Readonly<{
  id: string;
  name: string;
  type: string;
  version?: string | undefined;
  origin?: string | undefined;
}>;

export type CreateDocumentationSource = Readonly<{
  name: string;
  type: string;
  version?: string | undefined;
  origin?: string | undefined;
}>;
