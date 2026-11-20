"use strict";
function define(name, dependencies, initializer) {
    let self = define;
    if (self.moduleStates == null) {
        self.moduleStates = new Map();
    }
    if (self.dependentsMap == null) {
        self.dependentsMap = new Map();
    }
    function req(name, resolve, reject) {
        if (typeof name === "string") {
            return require(name);
        }
        else {
            let exports = Array();
            for (let dependency of name) {
                let moduleState = self.moduleStates.get(dependency);
                if (moduleState == null || moduleState.module == null) {
                    return reject === null || reject === void 0 ? void 0 : reject(new Error("Expected module with name " + dependency + " to be loaded!"));
                }
                exports.push(moduleState.module.exports);
            }
            return resolve === null || resolve === void 0 ? void 0 : resolve(...exports);
        }
    }
    function resolve(name) {
        let moduleState = self.moduleStates.get(name);
        if (moduleState == null || moduleState.module != null) {
            return;
        }
        let exports = Array();
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
            }
            catch (error) { }
            let moduleState = self.moduleStates.get(dependency);
            if (moduleState == null || moduleState.module == null) {
                return;
            }
            exports.push(moduleState.module.exports);
        }
        if (typeof moduleState.initializer === "function") {
            moduleState.initializer(...exports);
        }
        else {
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
            dependents = new Set();
            self.dependentsMap.set(dependency, dependents);
        }
        dependents.add(name);
    }
    resolve(name);
}
