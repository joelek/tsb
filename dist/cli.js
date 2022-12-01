#!/usr/bin/env node
define("app", [], {
    "name": "@joelek/ts-bundle",
    "version": "1.4.1"
});
define("lib/is", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.present = exports.absent = void 0;
    function absent(subject) {
        return subject == null;
    }
    exports.absent = absent;
    ;
    function present(subject) {
        return subject != null;
    }
    exports.present = present;
    ;
});
define("lib/terminal", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.stylize = exports.BG_WHITE = exports.BG_CYAN = exports.BG_MAGENTA = exports.BG_BLUE = exports.BG_YELLOW = exports.BG_GREEN = exports.BG_RED = exports.BG_BLACK = exports.FG_WHITE = exports.FG_CYAN = exports.FG_MAGENTA = exports.FG_BLUE = exports.FG_YELLOW = exports.FG_GREEN = exports.FG_RED = exports.FG_BLACK = exports.UNDERLINE = exports.ITALIC = exports.FAINT = exports.BOLD = exports.RESET = void 0;
    exports.RESET = 0;
    exports.BOLD = 1;
    exports.FAINT = 2;
    exports.ITALIC = 3;
    exports.UNDERLINE = 4;
    exports.FG_BLACK = 30;
    exports.FG_RED = 31;
    exports.FG_GREEN = 32;
    exports.FG_YELLOW = 33;
    exports.FG_BLUE = 34;
    exports.FG_MAGENTA = 35;
    exports.FG_CYAN = 36;
    exports.FG_WHITE = 37;
    exports.BG_BLACK = 40;
    exports.BG_RED = 41;
    exports.BG_GREEN = 42;
    exports.BG_YELLOW = 43;
    exports.BG_BLUE = 44;
    exports.BG_MAGENTA = 45;
    exports.BG_CYAN = 46;
    exports.BG_WHITE = 47;
    function stylize(string, ...parameters) {
        return `\x1B[${parameters.join(";")}m` + string + `\x1B[${exports.RESET}m`;
    }
    exports.stylize = stylize;
    ;
});
define("lib/transformers", ["require", "exports", "typescript", "lib/is", "lib/terminal"], function (require, exports, libts, is, terminal) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.esmSideEffectsImportFromCjsRequire = exports.esmExportStarFromImportStarRequire = exports.esmExportFromCjsRequire = exports.esmImportFromCjsRequire = exports.esmExportStarFromExportStarRequire = exports.esmImportStarFromImportStarRequire = void 0;
    // Transforms `var/let/const <import> = __importStar(require(<path>));` into `import * as <import> from <path>;`.
    function esmImportStarFromImportStarRequire(node, factory, options) {
        if (!libts.isVariableStatement(node)) {
            return node;
        }
        let variableStatement = node;
        let variableDeclarationList = variableStatement.declarationList;
        // TODO: Support more than one declaration per statement.
        if (variableDeclarationList.declarations.length !== 1) {
            return node;
        }
        let variableDeclaration = variableDeclarationList.declarations[0];
        let importIdentifier = variableDeclaration.name;
        if (!libts.isIdentifier(importIdentifier)) {
            return node;
        }
        let importStarCall = variableDeclaration.initializer;
        if (is.absent(importStarCall)) {
            return node;
        }
        if (!libts.isCallExpression(importStarCall)) {
            return node;
        }
        let importStarIdentifier = importStarCall.expression;
        if (!libts.isIdentifier(importStarIdentifier)) {
            return node;
        }
        if (importStarIdentifier.getText() !== "__importStar") {
            return node;
        }
        let importStarArguments = importStarCall.arguments;
        if (importStarArguments.length !== 1) {
            return node;
        }
        let requireCall = importStarArguments[0];
        if (!libts.isCallExpression(requireCall)) {
            return node;
        }
        let requireIdentifier = requireCall.expression;
        if (!libts.isIdentifier(requireIdentifier)) {
            return node;
        }
        if (requireIdentifier.getText() !== "require") {
            return node;
        }
        let requireArguments = requireCall.arguments;
        if (requireArguments.length !== 1) {
            return node;
        }
        let requireArgument = requireArguments[0];
        if (!libts.isStringLiteral(requireArgument)) {
            return node;
        }
        let newNode = factory.createImportDeclaration(undefined, undefined, factory.createImportClause(false, undefined, factory.createNamespaceImport(factory.createIdentifier(importIdentifier.getText()))), factory.createStringLiteralFromNode(requireArgument));
        if (options.debug) {
            let source = `${node.getText()}`;
            let target = `import * as ${importIdentifier.getText()} from ${requireArgument.getText()};`;
            console.log(`Transformed ${terminal.stylize(source, terminal.FG_RED)} into ${terminal.stylize(target, terminal.FG_GREEN)}`);
        }
        return newNode;
    }
    exports.esmImportStarFromImportStarRequire = esmImportStarFromImportStarRequire;
    ;
    // Transforms `__exportStar(require(<path>), exports);` into `export * from <path>;`.
    function esmExportStarFromExportStarRequire(node, factory, options) {
        if (!libts.isExpressionStatement(node)) {
            return node;
        }
        let exportStarCall = node.expression;
        if (!libts.isCallExpression(exportStarCall)) {
            return node;
        }
        let exportStarIdentifier = exportStarCall.expression;
        if (!libts.isIdentifier(exportStarIdentifier)) {
            return node;
        }
        if (exportStarIdentifier.getText() !== "__exportStar") {
            return node;
        }
        let exportStarArguments = exportStarCall.arguments;
        if (exportStarArguments.length !== 2) {
            return node;
        }
        let requireCall = exportStarArguments[0];
        if (!libts.isCallExpression(requireCall)) {
            return node;
        }
        let requireIdentifier = requireCall.expression;
        if (!libts.isIdentifier(requireIdentifier)) {
            return node;
        }
        if (requireIdentifier.getText() !== "require") {
            return node;
        }
        let requireArguments = requireCall.arguments;
        if (requireArguments.length !== 1) {
            return node;
        }
        let requireArgument = requireArguments[0];
        if (!libts.isStringLiteral(requireArgument)) {
            return node;
        }
        let exportsIdentifier = exportStarArguments[1];
        if (!libts.isIdentifier(exportsIdentifier)) {
            return node;
        }
        if (exportsIdentifier.getText() !== "exports") {
            return node;
        }
        let newNode = factory.createExportDeclaration(undefined, undefined, false, undefined, factory.createStringLiteralFromNode(requireArgument));
        if (options.debug) {
            let source = `${node.getText()}`;
            let target = `export * from ${requireArgument.getText()};`;
            console.log(`Transformed ${terminal.stylize(source, terminal.FG_RED)} into ${terminal.stylize(target, terminal.FG_GREEN)}`);
        }
        return newNode;
    }
    exports.esmExportStarFromExportStarRequire = esmExportStarFromExportStarRequire;
    ;
    // Transforms `var/let/const <import> = require(<path>);` into `import * as <import> from <path>;`.
    function esmImportFromCjsRequire(node, factory, options) {
        if (!libts.isVariableStatement(node)) {
            return node;
        }
        let variableStatement = node;
        let variableDeclarationList = variableStatement.declarationList;
        // TODO: Support more than one declaration per statement.
        if (variableDeclarationList.declarations.length !== 1) {
            return node;
        }
        let variableDeclaration = variableDeclarationList.declarations[0];
        let importIdentifier = variableDeclaration.name;
        if (!libts.isIdentifier(importIdentifier)) {
            return node;
        }
        let requireCall = variableDeclaration.initializer;
        if (is.absent(requireCall)) {
            return node;
        }
        if (!libts.isCallExpression(requireCall)) {
            return node;
        }
        let requireIdentifier = requireCall.expression;
        if (!libts.isIdentifier(requireIdentifier)) {
            return node;
        }
        if (requireIdentifier.getText() !== "require") {
            return node;
        }
        let requireArguments = requireCall.arguments;
        if (requireArguments.length !== 1) {
            return node;
        }
        let requireArgument = requireArguments[0];
        if (!libts.isStringLiteral(requireArgument)) {
            return node;
        }
        let newNode = factory.createImportDeclaration(undefined, undefined, factory.createImportClause(false, undefined, factory.createNamespaceImport(factory.createIdentifier(importIdentifier.getText()))), factory.createStringLiteralFromNode(requireArgument));
        if (options.debug) {
            let source = `${node.getText()}`;
            let target = `import * as ${importIdentifier.getText()} from ${requireArgument.getText()};`;
            console.log(`Transformed ${terminal.stylize(source, terminal.FG_RED)} into ${terminal.stylize(target, terminal.FG_GREEN)}`);
        }
        return newNode;
    }
    exports.esmImportFromCjsRequire = esmImportFromCjsRequire;
    ;
    // Transforms `exports.<export> = require(<path>);` into `export * as <export> from <path>;`.
    function esmExportFromCjsRequire(node, factory, options) {
        if (!libts.isExpressionStatement(node)) {
            return node;
        }
        let expression = node.expression;
        if (!libts.isBinaryExpression(expression)) {
            return node;
        }
        if (expression.operatorToken.kind !== libts.SyntaxKind.EqualsToken) {
            return node;
        }
        let exportsExpression = expression.left;
        if (!libts.isPropertyAccessExpression(exportsExpression)) {
            return node;
        }
        let exportsIdentifier = exportsExpression.expression;
        if (!libts.isIdentifier(exportsIdentifier)) {
            return node;
        }
        if (exportsIdentifier.getText() !== "exports") {
            return node;
        }
        let exportIdentifier = exportsExpression.name;
        if (!libts.isIdentifier(exportIdentifier)) {
            return node;
        }
        let requireCall = expression.right;
        if (!libts.isCallExpression(requireCall)) {
            return node;
        }
        let requireIdentifier = requireCall.expression;
        if (!libts.isIdentifier(requireIdentifier)) {
            return node;
        }
        if (requireIdentifier.getText() !== "require") {
            return node;
        }
        let requireArguments = requireCall.arguments;
        if (requireArguments.length !== 1) {
            return node;
        }
        let requireArgument = requireArguments[0];
        if (!libts.isStringLiteral(requireArgument)) {
            return node;
        }
        let newNode = factory.createExportDeclaration(undefined, undefined, false, factory.createNamespaceExport(factory.createIdentifier(exportIdentifier.getText())), factory.createStringLiteralFromNode(requireArgument));
        if (options.debug) {
            let source = `${node.getText()}`;
            let target = `export * as ${exportIdentifier.getText()} from ${requireArgument.getText()};`;
            console.log(`Transformed ${terminal.stylize(source, terminal.FG_RED)} into ${terminal.stylize(target, terminal.FG_GREEN)}`);
        }
        return newNode;
    }
    exports.esmExportFromCjsRequire = esmExportFromCjsRequire;
    ;
    // Transforms `exports.<export> = __importStar(require(<path>));` into `export * as <export> from <path>;`.
    function esmExportStarFromImportStarRequire(node, factory, options) {
        if (!libts.isExpressionStatement(node)) {
            return node;
        }
        let expression = node.expression;
        if (!libts.isBinaryExpression(expression)) {
            return node;
        }
        if (expression.operatorToken.kind !== libts.SyntaxKind.EqualsToken) {
            return node;
        }
        let exportsExpression = expression.left;
        if (!libts.isPropertyAccessExpression(exportsExpression)) {
            return node;
        }
        let exportsIdentifier = exportsExpression.expression;
        if (!libts.isIdentifier(exportsIdentifier)) {
            return node;
        }
        if (exportsIdentifier.getText() !== "exports") {
            return node;
        }
        let exportIdentifier = exportsExpression.name;
        if (!libts.isIdentifier(exportIdentifier)) {
            return node;
        }
        let importStarCall = expression.right;
        if (!libts.isCallExpression(importStarCall)) {
            return node;
        }
        let importStarIdentifier = importStarCall.expression;
        if (!libts.isIdentifier(importStarIdentifier)) {
            return node;
        }
        if (importStarIdentifier.getText() !== "__importStar") {
            return node;
        }
        let importStarArguments = importStarCall.arguments;
        if (importStarArguments.length !== 1) {
            return node;
        }
        let requireCall = importStarArguments[0];
        if (!libts.isCallExpression(requireCall)) {
            return node;
        }
        let requireIdentifier = requireCall.expression;
        if (!libts.isIdentifier(requireIdentifier)) {
            return node;
        }
        if (requireIdentifier.getText() !== "require") {
            return node;
        }
        let requireArguments = requireCall.arguments;
        if (requireArguments.length !== 1) {
            return node;
        }
        let requireArgument = requireArguments[0];
        if (!libts.isStringLiteral(requireArgument)) {
            return node;
        }
        let newNode = factory.createExportDeclaration(undefined, undefined, false, factory.createNamespaceExport(factory.createIdentifier(exportIdentifier.getText())), factory.createStringLiteralFromNode(requireArgument));
        if (options.debug) {
            let source = `${node.getText()}`;
            let target = `export * as ${exportIdentifier.getText()} from ${requireArgument.getText()};`;
            console.log(`Transformed ${terminal.stylize(source, terminal.FG_RED)} into ${terminal.stylize(target, terminal.FG_GREEN)}`);
        }
        return newNode;
    }
    exports.esmExportStarFromImportStarRequire = esmExportStarFromImportStarRequire;
    ;
    // Transforms `require(<path>);` into `import <path>;`.
    function esmSideEffectsImportFromCjsRequire(node, factory, options) {
        if (!libts.isExpressionStatement(node)) {
            return node;
        }
        let expressionStatement = node;
        let expression = expressionStatement.expression;
        if (!libts.isCallExpression(expression)) {
            return node;
        }
        let requireCall = expression;
        let requireIdentifier = requireCall.expression;
        if (!libts.isIdentifier(requireIdentifier)) {
            return node;
        }
        if (requireIdentifier.getText() !== "require") {
            return node;
        }
        let requireArguments = requireCall.arguments;
        if (requireArguments.length !== 1) {
            return node;
        }
        let requireArgument = requireArguments[0];
        if (!libts.isStringLiteral(requireArgument)) {
            return node;
        }
        let newNode = factory.createImportDeclaration(undefined, undefined, undefined, factory.createStringLiteralFromNode(requireArgument));
        if (options.debug) {
            let source = `${node.getText()}`;
            let target = `import ${requireArgument.getText()};`;
            console.log(`Transformed ${terminal.stylize(source, terminal.FG_RED)} into ${terminal.stylize(target, terminal.FG_GREEN)}`);
        }
        return newNode;
    }
    exports.esmSideEffectsImportFromCjsRequire = esmSideEffectsImportFromCjsRequire;
    ;
});
define("lib/index", ["require", "exports", "typescript", "lib/is", "lib/terminal", "lib/transformers"], function (require, exports, libts, is, terminal, transformers) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.bundle = void 0;
    const DEFINE = `function define(e,t,n){let l=define;function u(e){return require(e)}null==l.moduleStates&&(l.moduleStates=new Map),null==l.dependentsMap&&(l.dependentsMap=new Map);let i=l.moduleStates.get(e);if(null!=i)throw new Error("Duplicate module found with name "+e+"!");i={initializer:n,dependencies:t,module:null},l.moduleStates.set(e,i);for(let n of t){let t=l.dependentsMap.get(n);null==t&&(t=new Set,l.dependentsMap.set(n,t)),t.add(e)}!function e(t){let n=l.moduleStates.get(t);if(null==n||null!=n.module)return;let i=Array(),o={exports:{}};for(let e of n.dependencies){if("require"===e){i.push(u);continue}if("module"===e){i.push(o);continue}if("exports"===e){i.push(o.exports);continue}try{i.push(u(e));continue}catch(e){}let t=l.moduleStates.get(e);if(null==t||null==t.module)return;i.push(t.module.exports)}"function"==typeof n.initializer?n.initializer(...i):o.exports=n.initializer,n.module=o;let d=l.dependentsMap.get(t);if(null!=d)for(let t of d)e(t)}(e)}`;
    function createTransformers(options) {
        return {
            before: [
                (context) => {
                    let factory = context.factory;
                    return {
                        transformBundle(node) {
                            return node;
                        },
                        transformSourceFile(node) {
                            return libts.visitEachChild(node, (node) => {
                                node = transformers.esmImportFromCjsRequire(node, factory, options);
                                node = transformers.esmExportFromCjsRequire(node, factory, options);
                                node = transformers.esmExportStarFromExportStarRequire(node, factory, options);
                                node = transformers.esmImportStarFromImportStarRequire(node, factory, options);
                                node = transformers.esmExportStarFromImportStarRequire(node, factory, options);
                                node = transformers.esmSideEffectsImportFromCjsRequire(node, factory, options);
                                return node;
                            }, context);
                        }
                    };
                }
            ]
        };
    }
    function createCompilerHost(compilerOptions, pkg, options) {
        var _a, _b;
        let dependencies = (_a = pkg === null || pkg === void 0 ? void 0 : pkg.dependencies) !== null && _a !== void 0 ? _a : {};
        let devDependencies = (_b = pkg === null || pkg === void 0 ? void 0 : pkg.devDependencies) !== null && _b !== void 0 ? _b : {};
        let host = libts.createCompilerHost(compilerOptions);
        let declarationFiles = new Array();
        host.resolveModuleNames = (moduleNames, containingFile, reusedNames, redirectedReference, compilerOptions) => {
            return moduleNames.map((moduleName) => {
                let result = libts.resolveModuleName(moduleName, containingFile, compilerOptions, libts.sys);
                if (is.absent(result.resolvedModule)) {
                    return;
                }
                let resolvedFileName = result.resolvedModule.resolvedFileName;
                let packageId = result.resolvedModule.packageId;
                let isExternalLibraryImport = false;
                if (resolvedFileName.endsWith(".d.ts")) {
                    let resolvedFileNameJs = resolvedFileName.slice(0, -5) + `.js`;
                    if (host.fileExists(resolvedFileNameJs)) {
                        resolvedFileName = resolvedFileNameJs;
                    }
                    else {
                        declarationFiles.push(moduleName);
                        return;
                    }
                }
                if (is.present(packageId)) {
                    if (packageId.name in dependencies && !options.dependencies) {
                        isExternalLibraryImport = true;
                    }
                    if (packageId.name in devDependencies && !options.devDependencies) {
                        isExternalLibraryImport = true;
                    }
                }
                if (options.debug) {
                    console.log(`Resolved ${terminal.stylize("\"" + moduleName + "\"", terminal.FG_YELLOW)} as ${terminal.stylize("\"" + resolvedFileName + "\"", terminal.FG_YELLOW)} (${terminal.stylize(isExternalLibraryImport ? "external" : "internal", terminal.FG_MAGENTA)})`);
                }
                return {
                    resolvedFileName,
                    isExternalLibraryImport
                };
            });
        };
        host.readFile = (filename) => {
            let contents = libts.sys.readFile(filename);
            if (is.absent(contents)) {
                return;
            }
            if (!filename.endsWith(".js")) {
                return contents;
            }
            let output = libts.transpileModule(contents, {
                compilerOptions: {
                    module: libts.ModuleKind.ESNext,
                    target: libts.ScriptTarget.ESNext
                },
                transformers: createTransformers(options)
            });
            return output.outputText;
        };
        host.writeFile = (filename, data) => {
            for (let declarationFile of declarationFiles) {
                data += `define("${declarationFile}", [], function () {});\n`;
            }
            data = data + DEFINE;
            libts.sys.writeFile(filename, data);
        };
        return host;
    }
    function readPackageJson(entry) {
        let path = libts.findConfigFile(entry, libts.sys.fileExists, "package.json");
        if (is.absent(path)) {
            return;
        }
        let contents = libts.sys.readFile(path);
        if (is.absent(contents)) {
            return;
        }
        return JSON.parse(contents);
    }
    function bundle(options) {
        let config = {
            allowJs: true,
            esModuleInterop: false,
            isolatedModules: true,
            module: libts.ModuleKind.AMD,
            moduleResolution: libts.ModuleResolutionKind.NodeJs,
            outFile: options.bundle,
            resolveJsonModule: true,
            target: libts.ScriptTarget.ESNext
        };
        let pkg = readPackageJson(options.entry);
        let compiler = createCompilerHost(config, pkg, options);
        let program = libts.createProgram([options.entry], config, compiler);
        let result = program.emit();
        let errors = result.diagnostics.map((diagnostic) => {
            if (is.present(diagnostic.file) && is.present(diagnostic.start)) {
                let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                let message = libts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
                return `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`;
            }
            else {
                return libts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            }
        });
        let log = errors.join("\n");
        if (result.emitSkipped) {
            throw log;
        }
        else {
            process.stderr.write(`${log}\n`);
        }
    }
    exports.bundle = bundle;
    ;
});
define("cli/index", ["require", "exports", "app", "lib/index"], function (require, exports, app, lib) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Object.defineProperty(exports, "__esModule", { value: true });
    function run() {
        var _a, _b, _c;
        let options = {};
        let unrecognizedArguments = [];
        for (let arg of process.argv.slice(2)) {
            let parts = null;
            if (false) {
            }
            else if ((parts = /^--entry=(.+)$/.exec(arg)) != null) {
                options.entry = parts[1];
            }
            else if ((parts = /^--bundle=(.+)$/.exec(arg)) != null) {
                options.bundle = parts[1];
            }
            else if ((parts = /^--debug=(true|false)$/.exec(arg)) != null) {
                options.debug = parts[1] === "true";
            }
            else if ((parts = /^--dependencies=(true|false)$/.exec(arg)) != null) {
                options.dependencies = parts[1] === "true";
            }
            else if ((parts = /^--dev-dependencies=(true|false)$/.exec(arg)) != null) {
                options.devDependencies = parts[1] === "true";
            }
            else {
                unrecognizedArguments.push(arg);
            }
        }
        let entry = options.entry;
        let bundle = options.bundle;
        let debug = (_a = options.debug) !== null && _a !== void 0 ? _a : false;
        let dependencies = (_b = options.dependencies) !== null && _b !== void 0 ? _b : false;
        let devDependencies = (_c = options.devDependencies) !== null && _c !== void 0 ? _c : true;
        if (unrecognizedArguments.length > 0 || entry == null || bundle == null) {
            process.stderr.write(`${app.name} v${app.version}\n`);
            process.stderr.write(`\n`);
            for (let unrecognizedArgument of unrecognizedArguments) {
                process.stderr.write(`Unrecognized argument "${unrecognizedArgument}"!\n`);
            }
            process.stderr.write(`\n`);
            process.stderr.write(`Arguments:\n`);
            process.stderr.write(`	--entry=string\n`);
            process.stderr.write(`		Set entry point (input file) for bundling.\n`);
            process.stderr.write(`	--bundle=string\n`);
            process.stderr.write(`		Set bundle (output file) for bundling.\n`);
            process.stderr.write(`	--debug=boolean\n`);
            process.stderr.write(`		Set debug mode.\n`);
            process.stderr.write(`	--dependencies=boolean\n`);
            process.stderr.write(`		Configure bundling of dependencies listed under "dependencies".\n`);
            process.stderr.write(`	--dev-dependencies=boolean\n`);
            process.stderr.write(`		Configure bundling of dependencies listed under "devDependencies".\n`);
            return 1;
        }
        try {
            lib.bundle({
                entry,
                bundle,
                debug,
                dependencies,
                devDependencies
            });
            return 0;
        }
        catch (error) {
            process.stderr.write(String(error) + "\n");
            return 1;
        }
    }
    process.exit(run());
});
function define(e,t,n){let l=define;function u(e){return require(e)}null==l.moduleStates&&(l.moduleStates=new Map),null==l.dependentsMap&&(l.dependentsMap=new Map);let i=l.moduleStates.get(e);if(null!=i)throw new Error("Duplicate module found with name "+e+"!");i={initializer:n,dependencies:t,module:null},l.moduleStates.set(e,i);for(let n of t){let t=l.dependentsMap.get(n);null==t&&(t=new Set,l.dependentsMap.set(n,t)),t.add(e)}!function e(t){let n=l.moduleStates.get(t);if(null==n||null!=n.module)return;let i=Array(),o={exports:{}};for(let e of n.dependencies){if("require"===e){i.push(u);continue}if("module"===e){i.push(o);continue}if("exports"===e){i.push(o.exports);continue}try{i.push(u(e));continue}catch(e){}let t=l.moduleStates.get(e);if(null==t||null==t.module)return;i.push(t.module.exports)}"function"==typeof n.initializer?n.initializer(...i):o.exports=n.initializer,n.module=o;let d=l.dependentsMap.get(t);if(null!=d)for(let t of d)e(t)}(e)}