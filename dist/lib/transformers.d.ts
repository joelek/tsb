import * as libts from "typescript";
import * as shared from "./shared";
export declare function esmImportStarFromImportStarRequire(node: libts.Node, factory: libts.NodeFactory, options: shared.Options): libts.Node;
export declare function esmExportStarFromExportStarRequire(node: libts.Node, factory: libts.NodeFactory, options: shared.Options): libts.Node;
export declare function esmImportFromCjsRequire(node: libts.Node, factory: libts.NodeFactory, options: shared.Options): libts.Node;
export declare function esmExportFromCjsRequire(node: libts.Node, factory: libts.NodeFactory, options: shared.Options): libts.Node;
export declare function esmExportStarFromImportStarRequire(node: libts.Node, factory: libts.NodeFactory, options: shared.Options): libts.Node;
export declare function esmSideEffectsImportFromCjsRequire(node: libts.Node, factory: libts.NodeFactory, options: shared.Options): libts.Node;
