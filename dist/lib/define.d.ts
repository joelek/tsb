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
declare function define(name: string, dependencies: Array<string>, initializer: ModuleInitializer): void;
