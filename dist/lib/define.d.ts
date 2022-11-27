declare type Exports = any;
declare type Module = {
    exports: Exports;
};
declare type ModuleCallback = {
    (...exports: Array<Exports>): void;
};
declare type ModuleInitializer = ModuleCallback | Exports;
declare type ModuleState = {
    initializer: ModuleInitializer;
    dependencies: Array<string>;
    module: Module | null;
};
declare type Define = {
    (name: string, dependencies: Array<string>, initializer: ModuleInitializer): void;
    moduleStates: Map<string, ModuleState>;
    dependentsMap: Map<string, Set<string>>;
};
declare function define(name: string, dependencies: Array<string>, initializer: ModuleInitializer): void;
