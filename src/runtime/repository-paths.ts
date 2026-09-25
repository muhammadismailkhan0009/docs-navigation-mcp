import os from "node:os";
import path from "node:path";

export function parseRepositoryPaths(value: string | undefined): readonly string[] {
  if (value === undefined || value.trim() === "") {
    return [path.join(os.homedir(), ".docs-navigation-mcp", "repository")];
  }

  const repositories = value
    .split(path.delimiter)
    .map((repository) => repository.trim())
    .filter((repository) => repository.length > 0);

  if (repositories.length === 0) {
    throw new Error("DOCNAV_REPOSITORIES must contain at least one path.");
  }

  return repositories;
}
