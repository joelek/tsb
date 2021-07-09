import * as libts from "typescript";
import * as is from "./is";

const DEBUG = false;

// Transforms `var/let/const <import> = require(<path>);` into `import * as <import> from <path>;`.
export function esmImportFromCjsRequire(node: libts.Node, factory: libts.NodeFactory): libts.Node {
	if (!libts.isVariableStatement(node)) {
		return node;
	}
	let variableStatement = node;
	let variableDeclarationList = variableStatement.declarationList;
	// TODO: Support more than one declaration per statement.
	if (variableDeclarationList.declarations.length !== 1) {
		return node;
	}
	let variableDeclaration = variableDeclarationList.declarations[0];
	let importIdentifier = variableDeclaration.name;
	if (!libts.isIdentifier(importIdentifier)) {
		return node;
	}
	let requireCall = variableDeclaration.initializer;
	if (is.absent(requireCall)) {
		return node;
	}
	if (!libts.isCallExpression(requireCall)) {
		return node;
	}
	let requireIdentifier = requireCall.expression;
	if (!libts.isIdentifier(requireIdentifier)) {
		return node;
	}
	if (requireIdentifier.getText() !== "require") {
		return node;
	}
	let requireArguments = requireCall.arguments;
	if (requireArguments.length !== 1) {
		return node;
	}
	let requireArgument = requireArguments[0];
	if (!libts.isStringLiteral(requireArgument)) {
		return node;
	}
	if (DEBUG) console.log("esmImportFromCjsRequire", requireArgument.getText());
	return factory.createImportDeclaration(
		undefined,
		undefined,
		factory.createImportClause(
			false,
			undefined,
			factory.createNamespaceImport(importIdentifier)
		),
		requireArgument
	);
};

// Transforms `exports.<export> = require(<path>);` into `export * as <export> from <path>;`.
export function esmExportFromCjsRequire(node: libts.Node, factory: libts.NodeFactory): libts.Node {
	if (!libts.isExpressionStatement(node)) {
		return node;
	}
	let expression = node.expression;
	if (!libts.isBinaryExpression(expression)) {
		return node;
	}
	if (expression.operatorToken.kind !== libts.SyntaxKind.EqualsToken) {
		return node;
	}
	let exportsExpression = expression.left;
	if (!libts.isPropertyAccessExpression(exportsExpression)) {
		return node;
	}
	let exportsIdentifier = exportsExpression.expression;
	if (!libts.isIdentifier(exportsIdentifier)) {
		return node;
	}
	if (exportsIdentifier.getText() !== "exports") {
		return node;
	}
	let exportIdentifier = exportsExpression.name;
	if (!libts.isIdentifier(exportIdentifier)) {
		return node;
	}
	let requireCall = expression.right;
	if (!libts.isCallExpression(requireCall)) {
		return node;
	}
	let requireIdentifier = requireCall.expression;
	if (!libts.isIdentifier(requireIdentifier)) {
		return node;
	}
	if (requireIdentifier.getText() !== "require") {
		return node;
	}
	let requireArguments = requireCall.arguments;
	if (requireArguments.length !== 1) {
		return node;
	}
	let requireArgument = requireArguments[0];
	if (!libts.isStringLiteral(requireArgument)) {
		return node;
	}
	if (DEBUG) console.log("esmExportFromCjsRequire", requireArgument.getText());
	return factory.createExportDeclaration(
		undefined,
		undefined,
		false,
		factory.createNamespaceExport(exportIdentifier),
		requireArgument
	);
};
