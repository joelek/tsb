type Exports = any;

type Module = {
	exports: Exports;
};

type ModuleCallback = {
	(...exports: Array<Exports>): void;
};

type ModuleState = {
	callback: ModuleCallback;
	dependencies: Array<string>;
	module: Module | null;
};

type Define = {
	(name: string, dependencies: Array<string>, callback: ModuleCallback): void;
	moduleStates: Map<string, ModuleState>;
};

function define(name: string, dependencies: Array<string>, callback: ModuleCallback): void {
	let self = define as Define;
	if (self.moduleStates == null) {
		self.moduleStates = new Map<string, ModuleState>();
	}
	function req(name: string): any {
		return require(name);
	}
	function resolve(name: string): void {
		let moduleState = self.moduleStates.get(name);
		if (moduleState == null || moduleState.module != null) {
			return;
		}
		let exports = Array<Exports>();
		let module = {
			exports: {}
		};
		for (let dependency of moduleState.dependencies) {
			if (dependency === "require") {
				exports.push(req);
				continue;
			}
			if (dependency === "module") {
				exports.push(module);
				continue;
			}
			if (dependency === "exports") {
				exports.push(module.exports);
				continue;
			}
			try {
				exports.push(req(dependency));
				continue;
			} catch (error) {}
			let moduleState = self.moduleStates.get(dependency);
			if (moduleState == null || moduleState.module == null) {
				return;
			}
			exports.push(moduleState.module.exports);
		}
		moduleState.callback(...exports);
		moduleState.module = module;
		for (let dependency of moduleState.dependencies) {
			resolve(dependency);
		}
	}
	let moduleState = self.moduleStates.get(name);
	if (moduleState != null) {
		throw "Duplicate module found with name \"" + name + "\"!";
	}
	moduleState = {
		callback: callback,
		dependencies: dependencies,
		module: null
	};
	self.moduleStates.set(name, moduleState);
	resolve(name);
}
