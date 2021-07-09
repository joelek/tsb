import * as libts from "typescript";
import * as is from "./is";
import * as shared from "./shared";
import * as transformers from "./transformers";

const DEFINE = `function define(e,t,l){let u=define;function n(e){return require(e)}null==u.moduleStates&&(u.moduleStates=new Map);let o=u.moduleStates.get(e);if(null!=o)throw'Duplicate module found with name "'+e+'"!';o={callback:l,dependencies:t,module:null},u.moduleStates.set(e,o),function e(t){let l=u.moduleStates.get(t);if(null==l||null!=l.module)return;let o=Array(),d={exports:{}};for(let e of l.dependencies){if("require"===e){o.push(n);continue}if("module"===e){o.push(d);continue}if("exports"===e){o.push(d.exports);continue}try{o.push(n(e));continue}catch(e){}let t=u.moduleStates.get(e);if(null==t||null==t.module)return;o.push(t.module.exports)}l.callback(...o),l.module=d;for(let t of l.dependencies)e(t)}(e)}`;

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
	let host = libts.createCompilerHost(compilerOptions);
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
			transformers: createTransformers(options)
		});
		return output.outputText;
	};
	host.writeFile = (filename, data) => {
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
