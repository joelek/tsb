type Exports = any;

type Module = {
	exports: Exports;
};

type ModuleCallback = {
	(...exports: Array<Exports>): void;
};

type ModuleInitializer = ModuleCallback | Exports;

type ModuleState = {
	initializer: ModuleInitializer;
	dependencies: Array<string>;
	module: Module | null;
};

type Define = {
	(name: string, dependencies: Array<string>, initializer: ModuleInitializer): void;
	moduleStates: Map<string, ModuleState>;
	dependentsMap: Map<string, Set<string>>;
};

function define(name: string, dependencies: Array<string>, initializer: ModuleInitializer): void {
	let self = define as Define;
	if (self.moduleStates == null) {
		self.moduleStates = new Map<string, ModuleState>();
	}
	if (self.dependentsMap == null) {
		self.dependentsMap = new Map<string, Set<string>>();
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
			exports: {} as Exports
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
		if (typeof moduleState.initializer === "function") {
			moduleState.initializer(...exports);
		} else {
			module.exports = moduleState.initializer;
		}
		moduleState.module = module;
		let dependents = self.dependentsMap.get(name);
		if (dependents != null) {
			for (let dependent of dependents) {
				resolve(dependent);
			}
		}
	}
	let moduleState = self.moduleStates.get(name);
	if (moduleState != null) {
		throw new Error("Duplicate module found with name " + name + "!");
	}
	moduleState = {
		initializer: initializer,
		dependencies: dependencies,
		module: null
	};
	self.moduleStates.set(name, moduleState);
	for (let dependency of dependencies) {
		let dependents = self.dependentsMap.get(dependency);
		if (dependents == null) {
			dependents = new Set<string>();
			self.dependentsMap.set(dependency, dependents);
		}
		dependents.add(name);
	}
	resolve(name);
}
