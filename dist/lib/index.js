"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bundle = void 0;
const libts = require("typescript");
const is = require("./is");
const terminal = require("./terminal");
const transformers = require("./transformers");
const DEFINE = `function define(e,t,l){let n=define;function u(e,t,l){if("string"==typeof e)return require(e);{let u=Array();for(let t of e){let e=n.moduleStates.get(t);if(null==e||null==e.module)return null==l?void 0:l(new Error("Expected module with name "+t+" to be loaded!"));u.push(e.module.exports)}return null==t?void 0:t(...u)}}null==n.moduleStates&&(n.moduleStates=new Map),null==n.dependentsMap&&(n.dependentsMap=new Map);let o=n.moduleStates.get(e);if(null!=o)throw new Error("Duplicate module found with name "+e+"!");o={initializer:l,dependencies:t,module:null},n.moduleStates.set(e,o);for(let l of t){let t=n.dependentsMap.get(l);null==t&&(t=new Set,n.dependentsMap.set(l,t)),t.add(e)}!function e(t){let l=n.moduleStates.get(t);if(null==l||null!=l.module)return;let o=Array(),i={exports:{}};for(let e of l.dependencies){if("require"===e){o.push(u);continue}if("module"===e){o.push(i);continue}if("exports"===e){o.push(i.exports);continue}try{o.push(u(e));continue}catch(e){}let t=n.moduleStates.get(e);if(null==t||null==t.module)return;o.push(t.module.exports)}"function"==typeof l.initializer?l.initializer(...o):i.exports=l.initializer,l.module=i;let d=n.dependentsMap.get(t);if(null!=d)for(let t of d)e(t)}(e)}`;
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
    let declarationFiles = new Set();
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
                    declarationFiles.add(moduleName);
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
