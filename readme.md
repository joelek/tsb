# @joelek/ts-bundle

JavaScript bundler powered by the TypeScript compiler.

```
npx tsb --entry=<path> --bundle=<path>
```

## Background

The TypeScript compiler is incredibly versatile. It supports a wide variety of different script targets, module systems and includes compiler settings for almost every use-case.

The compiler is sufficiently equipped to produce modular packages consisting of a single JavaScript file for every TypeScript file in a given project. It may also be configured to produce TypeScript declaration files making the transpiled files usable from within other TypeScript projects.

When a TypeScript project is intended to be used as an application, a certain set of requirements arise.

The application needs to be able to load without the help of a development tool. It should load as fast as possible and ideally not require the end-user to install a set of external dependencies.

These requirements need to be addressed by the application developer and can, in most cases, not be fulfilled solely through use of the TypeScript compiler. Application developers therefore often delegate this task to what's known as a bundler.

A bundler, or linker, is a development tool designated for producing the final application artifacts, ready for consumption by the the end-user.

Two of the most popular bundlers for web projects are Browserify and Webpack. Although there are differences between the two, they both essentially figure out the interconnection of an application's components as well as their external dependencies while factoring in runtime constraints.

The TypeScript compiler includes limited support for bundling. It can produce bundles for projects but will not include files imported from external dependencies. Nor will it supply the loading mechanism required for loading the bundle. Therefore, the TypeScript compiler may only produce bundles that are of limited use.

This tool leverages the TypeScript compiler to produce standalone bundles from JavaScript files.

## Module systems

Writing software at scale requires modularity and re-usability for which module systems can be of great assistance.

Several module systems have been proposed and used within the JavaScript ecosystem of which two notable ones are still widely used.

### CommonJS

The CommonJS module system origins from the NodeJS ecosystem. Imports are performed using the built-in `require()` function while exports are handled using the implicitly-defined, module-scoped `module` and `exports` variables.

The system lacks functionality for partially importing modules but does allow for fine-grained control over the exports of a module.

CommonJS modules work great inside the NodeJS ecosystem but are not widely-supported elsewhere, specifically not in browser contexts.

A loader or bundler is required in order to support CommonJS modules in a browser context.

### ECMAScript

The ECMAScript module system origins from a standardization effort for JavaScript modules addressing several shortcomings of CommonJS while also introducing new functionality.

Imports and exports are performed using the `import` and `export` expressions, respectively. These expressions give fine-grained control over both the imports and exports of a module.

Adoption and support for the ECMAScript module system is bound to increase and improve over time as it is the standardized module system for the JavaScript ecosystem.

### Usage in NodeJS

NodeJS can be configured to load modules either using the CommonJS module system or using the ECMAScript module system.

The module system is configured based on the file ending of the script file passed when launching NodeJS.

Files ending in `.cjs` will configure NodeJS with the CommonJS module system while files ending in `.mjs` will configure NodeJS with the ECMAScript module system.

Files ending in `.js` will configure NodeJS using the `type` setting from the corresponding `package.json` file if present and will default to CommonJS when left unspecified.

```json
{
	"type": "commonjs"
}
```

```json
{
	"type": "module"
}
```

It is important to understand that the module resolution algorithm will change with the module system used.

The NodeJS module resolution algorithm will automatically attempt to append a `.js` suffix to the module specifier as part of the algorithm when using CommonJS modules. This is not done when using ECMAScript modules.

CommonJS file "imports" like `const module = require("./relative-specifier");` will break when switching to ECMAScript modules like `import * as module from "./relative-specifier";` unless the file extension is specified.

In addition, directory "imports" are supported when using CommonJS modules in NodeJS whereas they are unsupported when using ECMAScript modules.

### TypeScript

The TypeScript compiler can emit JavaScript files with the CommonJS module system by setting the `module` compiler option to `commonjs` in `tsconfig.json`.

```json
{
	"compilerOptions": {
		"module": "commonjs"
	}
}
```

The TypeScript compiler can emit JavaScript files with the ECMAScript module system by setting the `module` compiler option to `esnext` in `tsconfig.json`.

It is recommended to also set the `esModuleInterop` setting to `true` as this simplifies importing CommonJS modules from within ECMAScript modules.

```json
{
	"compilerOptions": {
		"esModuleInterop": true,
		"module": "esnext"
	}
}
```

## Features

This tool can be installed locally or globally. Use the `npx tsb` command for local installations and the `tsb` command for global installations.

### Standalone bundling

Specify the path of the entry point as well as the desired path of the bundle using the `--entry` and `--bundle` arguments, respectively.

```
npx tsb --entry=<path> --bundle=<path>
```

Dependencies referenced from the entry point and listed under the "dependencies" section of the "package.json" file will be treated as run-time dependencies and will not be included in the bundle. This behaviour may be controlled using the `--dependencies` argument.

Dependencies referenced from the entry point and listed under the "devDependencies" section of the "package.json" file will be treated as compile-time dependencies and will be included in the bundle. This behaviour may be controlled using the `--dev-dependencies` argument.

CommonJS and ECMAScript modules are supported and can be mixed but module specifiers are required to be compatible with the NodeJS module resolution algorithm.

A loader with a size less than 1 kB will automatically be included in the bundle.

## Sponsorship

The continued development of this software depends on your sponsorship. Please consider sponsoring this project if you find that the software creates value for you and your organization.

The sponsor button can be used to view the different sponsoring options. Contributions of all sizes are welcome.

Thank you for your support!

### Ethereum

Ethereum contributions can be made to address `0xf1B63d95BEfEdAf70B3623B1A4Ba0D9CE7F2fE6D`.

![](./eth.png)

## Installation

Releases follow semantic versioning and release packages are published using the GitHub platform. Use the following command to install the latest release.

```
npm install [-g] joelek/ts-bundle#semver:^1.3
```

Use the following command to install the very latest build. The very latest build may include breaking changes and should not be used in production environments.

```
npm install [-g] joelek/ts-bundle#master
```

NB: This project targets TypeScript 4 in strict mode.

## Roadmap

* Write unit tests.
* Handle decorators being required in TS4.7 for createImportDeclaration() and createExportDeclaration() and deprecated in TS4.8.
