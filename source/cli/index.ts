#!/usr/bin/env node

import * as bundler from "./bundler";
import * as is from "./is";
import * as shared from "./shared";

function run(): number {
	let options: Partial<shared.Options> = {};
	let foundUnrecognizedArgument = false;
	for (let argv of process.argv.slice(2)) {
		let parts: RegExpExecArray | null = null;
		if (false) {
		} else if ((parts = /^--entry=(.+)$/.exec(argv)) != null) {
			options.entry = parts[1];
		} else if ((parts = /^--bundle=(.+)$/.exec(argv)) != null) {
			options.bundle = parts[1];
		} else if ((parts = /^--debug=(true|false)$/.exec(argv)) != null) {
			options.debug = parts[1] === "true";
		} else if ((parts = /^--dependencies=(true|false)$/.exec(argv)) != null) {
			options.dependencies = parts[1] === "true";
		} else if ((parts = /^--dev-dependencies=(true|false)$/.exec(argv)) != null) {
			options.devDependencies = parts[1] === "true";
		} else {
			foundUnrecognizedArgument = true;
			process.stderr.write(`Unrecognized argument \"${argv}\"!\n`);
		}
	}
	let entry = options.entry;
	let bundle = options.bundle;
	let debug = options.debug ?? false;
	let dependencies = options.dependencies ?? false;
	let devDependencies = options.devDependencies ?? true;
	if (foundUnrecognizedArgument || is.absent(entry) || is.absent(bundle)) {
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
		bundler.bundle({
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
