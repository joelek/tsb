#!/usr/bin/env node
define("is", ["require", "exports"], function (require, exports) {
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
define("transformers", ["require", "exports", "typescript", "is"], function (require, exports, libts, is) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.esmExportFromCjsRequire = exports.esmImportFromCjsRequire = void 0;
    function esmImportFromCjsRequire(node, factory) {
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
        let bindingName = variableDeclaration.name;
        let expression = variableDeclaration.initializer;
        if (is.absent(expression) || !libts.isCallExpression(expression)) {
            return node;
        }
        let callExpression = expression;
        if (callExpression.expression.getText() !== "require") {
            return node;
        }
        if (callExpression.arguments.length !== 1) {
            return node;
        }
        let argument = callExpression.arguments[0];
        if (!libts.isStringLiteral(argument)) {
            return node;
        }
        let stringLiteral = argument;
        return factory.createImportDeclaration(undefined, undefined, factory.createImportClause(false, undefined, factory.createNamespaceImport(factory.createIdentifier(bindingName.getText()))), stringLiteral);
    }
    exports.esmImportFromCjsRequire = esmImportFromCjsRequire;
    ;
    function esmExportFromCjsRequire(node, factory) {
        if (!libts.isExpressionStatement(node)) {
            return node;
        }
        if (!libts.isBinaryExpression(node.expression)) {
            return node;
        }
        let binaryExpression = node.expression;
        let left = binaryExpression.left;
        let operator = binaryExpression.operatorToken;
        let right = binaryExpression.right;
        if (!libts.isPropertyAccessExpression(left)) {
            return node;
        }
        if (!libts.isIdentifier(left.expression) || left.expression.getText() !== "exports") {
            return node;
        }
        if (!libts.isIdentifier(left.name)) {
            return node;
        }
        if (operator.kind !== libts.SyntaxKind.EqualsToken) {
            return node;
        }
        if (!libts.isCallExpression(right)) {
            return node;
        }
        let expression = right.expression;
        if (!libts.isIdentifier(expression) || expression.getText() !== "require") {
            return node;
        }
        if (right.arguments.length !== 1) {
            return node;
        }
        let argument = right.arguments[0];
        if (!libts.isStringLiteral(argument)) {
            return node;
        }
        return factory.createExportDeclaration(undefined, undefined, false, factory.createNamespaceExport(left.name), argument);
    }
    exports.esmExportFromCjsRequire = esmExportFromCjsRequire;
    ;
});
define("bundler", ["require", "exports", "typescript", "is", "transformers"], function (require, exports, libts, is, transformers) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.bundle = void 0;
    const DEFINE = `function define(e,t,l){null==this.x&&(this.x=new Map),null==this.z&&(this.z=(e=>require(e))),null==this.y&&(this.y=(e=>{let t=this.x.get(e);if(null==t||null!=t.module)return;let l=Array(),u={exports:{}};for(let e of t.dependencies){if("require"===e){l.push(this.z);continue}if("module"===e){l.push(u);continue}if("exports"===e){l.push(u.exports);continue}try{l.push(this.z(e));continue}catch(e){}let t=this.x.get(e);if(null==t||null==t.module)return;l.push(t.module.exports)}t.callback(...l),t.module=u;for(let e of t.dependencies)this.y(e)}));let u=this.x.get(e);if(null!=u)throw'Duplicate module found with name "'+e+'"!';u={callback:l,dependencies:t,module:null},this.x.set(e,u),this.y(e)}`;
    function createTransformers() {
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
                                node = transformers.esmImportFromCjsRequire(node, factory);
                                node = transformers.esmExportFromCjsRequire(node, factory);
                                return node;
                            }, context);
                        }
                    };
                }
            ]
        };
    }
    function createCompilerHost(options, pkg) {
        var _a;
        let dependencies = (_a = pkg === null || pkg === void 0 ? void 0 : pkg.dependencies) !== null && _a !== void 0 ? _a : {};
        let host = libts.createCompilerHost(options);
        host.resolveModuleNames = (moduleNames, containingFile, reusedNames, redirectedReference, options) => {
            return moduleNames.map((moduleName) => {
                let result = libts.resolveModuleName(moduleName, containingFile, options, libts.sys);
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
                }
                if (is.present(packageId) && (packageId.name in dependencies)) {
                    isExternalLibraryImport = true;
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
                transformers: createTransformers()
            });
            return output.outputText;
        };
        host.writeFile = (filename, data) => {
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
            isolatedModules: true,
            module: libts.ModuleKind.AMD,
            moduleResolution: libts.ModuleResolutionKind.NodeJs,
            outFile: options.bundle,
            resolveJsonModule: true,
            target: libts.ScriptTarget.ESNext
        };
        let pkg = readPackageJson(options.entry);
        let compiler = createCompilerHost(config, pkg);
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
define("index", ["require", "exports", "bundler", "is"], function (require, exports, bundler, is) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Object.defineProperty(exports, "__esModule", { value: true });
    function run() {
        let options = {};
        let foundUnrecognizedArgument = false;
        for (let argv of process.argv.slice(2)) {
            let parts = null;
            if (false) {
            }
            else if ((parts = /^--entry=(.+)$/.exec(argv)) != null) {
                options.entry = parts[1];
            }
            else if ((parts = /^--bundle=(.+)$/.exec(argv)) != null) {
                options.bundle = parts[1];
            }
            else {
                foundUnrecognizedArgument = true;
                process.stderr.write(`Unrecognized argument \"${argv}\"!\n`);
            }
        }
        let entry = options.entry;
        let bundle = options.bundle;
        if (foundUnrecognizedArgument || is.absent(entry) || is.absent(bundle)) {
            process.stderr.write(`Arguments:\n`);
            process.stderr.write(`	--entry=string\n`);
            process.stderr.write(`	--bundle=string\n`);
            return 1;
        }
        try {
            bundler.bundle({
                entry,
                bundle
            });
            return 0;
        }
        catch (error) {
            process.stderr.write(error);
            return 1;
        }
    }
    process.exit(run());
});
function define(e,t,l){null==this.x&&(this.x=new Map),null==this.z&&(this.z=(e=>require(e))),null==this.y&&(this.y=(e=>{let t=this.x.get(e);if(null==t||null!=t.module)return;let l=Array(),u={exports:{}};for(let e of t.dependencies){if("require"===e){l.push(this.z);continue}if("module"===e){l.push(u);continue}if("exports"===e){l.push(u.exports);continue}try{l.push(this.z(e));continue}catch(e){}let t=this.x.get(e);if(null==t||null==t.module)return;l.push(t.module.exports)}t.callback(...l),t.module=u;for(let e of t.dependencies)this.y(e)}));let u=this.x.get(e);if(null!=u)throw'Duplicate module found with name "'+e+'"!';u={callback:l,dependencies:t,module:null},this.x.set(e,u),this.y(e)}