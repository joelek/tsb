import * as libts from "typescript";
import * as is from "./is";
import * as shared from "./shared";
import * as terminal from "./terminal";
import * as transformers from "./transformers";

export { Options } from "./shared";

const DEFINE = `function define(e,t,n){let l=define;function u(e){return require(e)}null==l.moduleStates&&(l.moduleStates=new Map),null==l.dependentsMap&&(l.dependentsMap=new Map);let i=l.moduleStates.get(e);if(null!=i)throw new Error("Duplicate module found with name "+e+"!");i={initializer:n,dependencies:t,module:null},l.moduleStates.set(e,i);for(let n of t){let t=l.dependentsMap.get(n);null==t&&(t=new Set,l.dependentsMap.set(n,t)),t.add(e)}!function e(t){let n=l.moduleStates.get(t);if(null==n||null!=n.module)return;let i=Array(),o={exports:{}};for(let e of n.dependencies){if("require"===e){i.push(u);continue}if("module"===e){i.push(o);continue}if("exports"===e){i.push(o.exports);continue}try{i.push(u(e));continue}catch(e){}let t=l.moduleStates.get(e);if(null==t||null==t.module)return;i.push(t.module.exports)}"function"==typeof n.initializer?n.initializer(...i):o.exports=n.initializer,n.module=o;let d=l.dependentsMap.get(t);if(null!=d)for(let t of d)e(t)}(e)}`;

function createTransformers(options: shared.Options): libts.CustomTransformers {
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

function createCompilerHost(compilerOptions: libts.CompilerOptions, pkg: any, options: shared.Options): libts.CompilerHost {
	let dependencies = pkg?.dependencies ?? {};
	let devDependencies = pkg?.devDependencies ?? {};
	let host = libts.createCompilerHost(compilerOptions);
	let declarationFiles = new Array<string>();
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
				} else {
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

function readPackageJson(entry: string): any {
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

export function bundle(options: shared.Options): void {
	let config: libts.CompilerOptions = {
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
	let program = libts.createProgram([ options.entry ], config, compiler);
	let result = program.emit();
	let errors = result.diagnostics.map((diagnostic) => {
		if (is.present(diagnostic.file) && is.present(diagnostic.start)) {
			let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
			let message = libts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
			return `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`;
		} else {
			return libts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
		}
	});
	let log = errors.join("\n");
	if (result.emitSkipped) {
		throw log;
	} else {
		process.stderr.write(`${log}\n`);
	}
};
