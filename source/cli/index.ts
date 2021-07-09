#!/usr/bin/env node

import * as bundler from "./bundler";
import * as is from "./is";

function run(): number {
	let options: Partial<bundler.Options> = {};
	let foundUnrecognizedArgument = false;
	for (let argv of process.argv.slice(2)) {
		let parts: RegExpExecArray | null = null;
		if (false) {
		} else if ((parts = /^--entry=(.+)$/.exec(argv)) != null) {
			options.entry = parts[1];
		} else if ((parts = /^--bundle=(.+)$/.exec(argv)) != null) {
			options.bundle = parts[1];
		} else {
			foundUnrecognizedArgument = true;
			process.stderr.write(`Unrecognized argument \"${argv}\"!\n`);
		}
	}
	let entry = options.entry;
	let bundle = options.bundle;
	if (foundUnrecognizedArgument || is.absent(entry) || is.absent(bundle)) {
		process.stderr.write(`Arguments:\n`);
		process.stderr.write(`	--entry=string\n`);
		process.stderr.write(`		Set entry point (input file) for bundling.\n`);
		process.stderr.write(`	--bundle=string\n`);
		process.stderr.write(`		Set bundle (output file) for bundling.\n`);
		return 1;
	}
	try {
		bundler.bundle({
			entry,
			bundle
		});
		return 0;
	} catch (error) {
		process.stderr.write(String(error) + "\n");
		return 1;
	}
}

process.exit(run());
