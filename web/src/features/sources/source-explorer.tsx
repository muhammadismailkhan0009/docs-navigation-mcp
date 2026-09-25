import { FlowRunner } from "@myriadcodelabs/uiflow";

import { sourceExplorerFlow } from "./source-explorer-flow";

export function SourceExplorer() {
  return <FlowRunner flow={sourceExplorerFlow} initialData={{}} />;
}
