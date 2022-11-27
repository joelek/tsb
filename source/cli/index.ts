#!/usr/bin/env node

import * as app from "../app.json";
import * as lib from "../lib/";

function run(): number {
	let options: Partial<lib.Options> = {};
	let unrecognizedArguments = [] as Array<string>;
	for (let arg of process.argv.slice(2)) {
		let parts: RegExpExecArray | null = null;
		if (false) {
		} else if ((parts = /^--entry=(.+)$/.exec(arg)) != null) {
			options.entry = parts[1];
		} else if ((parts = /^--bundle=(.+)$/.exec(arg)) != null) {
			options.bundle = parts[1];
		} else if ((parts = /^--debug=(true|false)$/.exec(arg)) != null) {
			options.debug = parts[1] === "true";
		} else if ((parts = /^--dependencies=(true|false)$/.exec(arg)) != null) {
			options.dependencies = parts[1] === "true";
		} else if ((parts = /^--dev-dependencies=(true|false)$/.exec(arg)) != null) {
			options.devDependencies = parts[1] === "true";
		} else {
			unrecognizedArguments.push(arg);
		}
	}
	let entry = options.entry;
	let bundle = options.bundle;
	let debug = options.debug ?? false;
	let dependencies = options.dependencies ?? false;
	let devDependencies = options.devDependencies ?? true;
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
	} catch (error) {
		process.stderr.write(String(error) + "\n");
		return 1;
	}
}

process.exit(run());
