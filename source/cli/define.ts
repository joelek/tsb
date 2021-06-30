type Exports = {

};

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
	moduleStates: Map<string, ModuleState>;
	require: (name: string) => ModuleState;
	resolve: (name: string) => void;
};

function define(this: Define, name: string, dependencies: Array<string>, callback: ModuleCallback): void {
	if (this.moduleStates == null) {
		this.moduleStates = new Map<string, ModuleState>();
	}
	if (this.require == null) {
		this.require = (name) => {
			return require(name);
		};
	}
	if (this.resolve == null) {
		this.resolve = (name) => {
			let moduleState = this.moduleStates.get(name);
			if (moduleState == null || moduleState.module != null) {
				return;
			}
			let exports = Array<Exports>();
			let module = {
				exports: {}
			};
			for (let dependency of moduleState.dependencies) {
				if (dependency === "require") {
					exports.push(this.require);
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
					exports.push(this.require(dependency));
					continue;
				} catch (error) {}
				let moduleState = this.moduleStates.get(dependency);
				if (moduleState == null || moduleState.module == null) {
					return;
				}
				exports.push(moduleState.module.exports);
			}
			moduleState.callback(...exports);
			moduleState.module = module;
			for (let dependency of moduleState.dependencies) {
				this.resolve(dependency);
			}
		};
	}
	let moduleState = this.moduleStates.get(name);
	if (moduleState != null) {
		throw "Duplicate module found with name \"" + name + "\"!";
	}
	moduleState = {
		callback: callback,
		dependencies: dependencies,
		module: null
	};
	this.moduleStates.set(name, moduleState);
	this.resolve(name);
}
