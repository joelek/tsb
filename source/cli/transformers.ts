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
	let bindingName = variableDeclaration.name;
	let expression = variableDeclaration.initializer;
	if (is.absent(expression) || !libts.isCallExpression(expression)) {
		return node;
	}
	let callExpression = expression;
	if (callExpression.expression.getText() !== "require") {
		return node;
	}
	if (callExpression.arguments.length !== 1) {
		return node;
	}
	let argument = callExpression.arguments[0];
	if (!libts.isStringLiteral(argument)) {
		return node;
	}
	let stringLiteral = argument;
	if (DEBUG) console.log("esmImportFromCjsRequire", bindingName.getText());
	return factory.createImportDeclaration(
		undefined,
		undefined,
		factory.createImportClause(
			false,
			undefined,
			factory.createNamespaceImport(factory.createIdentifier(bindingName.getText()))
		),
		stringLiteral
	);
};

// Transforms `exports.<export> = require(<path>);` into `export * as <export> from <path>;`.
export function esmExportFromCjsRequire(node: libts.Node, factory: libts.NodeFactory): libts.Node {
	if (!libts.isExpressionStatement(node)) {
		return node;
	}
	if (!libts.isBinaryExpression(node.expression)) {
		return node;
	}
	let binaryExpression = node.expression;
	let left = binaryExpression.left;
	let operator = binaryExpression.operatorToken;
	let right = binaryExpression.right;
	if (!libts.isPropertyAccessExpression(left)) {
		return node;
	}
	if (!libts.isIdentifier(left.expression) || left.expression.getText() !== "exports") {
		return node;
	}
	if (!libts.isIdentifier(left.name)) {
		return node;
	}
	if (operator.kind !== libts.SyntaxKind.EqualsToken) {
		return node;
	}
	if (!libts.isCallExpression(right)) {
		return node;
	}
	let expression = right.expression;
	if (!libts.isIdentifier(expression) || expression.getText() !== "require") {
		return node;
	}
	if (right.arguments.length !== 1) {
		return node;
	}
	let argument = right.arguments[0];
	if (!libts.isStringLiteral(argument)) {
		return node;
	}
	if (DEBUG) console.log("esmExportFromCjsRequire", argument.getText());
	return factory.createExportDeclaration(
		undefined,
		undefined,
		false,
		factory.createNamespaceExport(left.name),
		argument
	);
};
