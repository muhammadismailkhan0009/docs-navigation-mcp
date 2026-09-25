import type {
  DocumentationDocument,
  DocumentationNodePage,
  DocumentationSource,
} from "./docs-models";

export async function listSources(): Promise<readonly DocumentationSource[]> {
  return requestJson("/api/sources");
}

export async function listChildren(
  sourceId: string,
  parentId?: string,
): Promise<DocumentationNodePage> {
  const search = new URLSearchParams({ limit: "500" });
  if (parentId !== undefined) search.set("parent_id", parentId);

  return requestJson(
    `/api/sources/${encodeURIComponent(sourceId)}/children?${search.toString()}`,
  );
}

export async function fetchDocument(
  sourceId: string,
  nodeId: string,
): Promise<DocumentationDocument> {
  return requestJson(
    `/api/sources/${encodeURIComponent(sourceId)}/nodes/${encodeURIComponent(nodeId)}`,
  );
}

async function requestJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const payload = (await response.json()) as unknown;

  if (!response.ok) {
    const error =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : `Request failed with status ${response.status}`;
    throw new Error(error);
  }

  return payload as T;
}
