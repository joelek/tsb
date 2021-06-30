# @joelek/ts-bundle

JavaScript bundler powered by the TypeScript compiler.

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

## Features

### Standalone bundling

This tool can be installed locally or globally. Use the `npx tsb` command for local installations and the `tsb` command for global installations.

Specify the path of the entry point as well as the desired path of the bundle using the "--entry" and "--bundle" arguments, respectively.

```
npx tsb --entry=<path> --bundle=<path>
```

Dependencies listed under the "devDependencies" section of the "package.json" file will be treated as compile-time dependencies and will be included in the bundle.

Dependencies listed under the "dependencies" section of the "package.json" file will be treated as run-time dependencies and will not be included in the bundle.

A loader with a size less than 1 kB will automatically be included in the bundle.

## Sponsorship

The continued development of this software depends on your sponsorship. Please consider sponsoring this project if you find that the software creates value for you and your organization.

The sponsor button can be used to view the different sponsoring options. Contributions of all sizes are welcome.

Thank you for your support!

## Installation

Releases follow semantic versioning and release packages are published using the GitHub platform. Use the following command to install the latest release.

```
npm install joelek/ts-bundle#semver:^0
```

Use the following command to install the very latest build. The very latest build may include breaking changes and should not be used in production environments.

```
npm install joelek/ts-bundle#master
```

NB: This project targets TypeScript 4 in strict mode.
