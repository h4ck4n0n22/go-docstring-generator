// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let timeout: NodeJS.Timeout | undefined;
	// Register listener for text changes in the editor
	const disposable = vscode.workspace.onDidChangeTextDocument((event) => {
		const editor = vscode.window.activeTextEditor;

		if (!editor || event.document !== editor.document) {
			return;
		}

		const changes = event.contentChanges;
		const lastChange = changes[changes.length - 1];

		if (lastChange && lastChange.text === '"') {
			if (timeout) {
				clearTimeout(timeout);
			}

			// use small delay to handle all three quotes typed
			timeout = setTimeout(() => {
				// check if previous two chars are also '"'
				const position = editor.selection.active;
				const lineText = editor.document.lineAt(position.line).text;

				if (lineText.endsWith('"""')) {
					generateAndInsertDosctring(editor, position);
				}
			}, 50); // 50ms debounce delay
		}
	});

	context.subscriptions.push(disposable);
}

function generateAndInsertDosctring(editor: vscode.TextEditor, position: vscode.Position) {
	const document = editor.document;

	// find the closest Go function declaration
	let functionLine = '';
	for (let i = position.line; i >= 0; i--) {
		const lineText = document.lineAt(i).text;
		if (lineText.includes('func ')) {
			functionLine = lineText;
			break;
		}
	}

	if (!functionLine) {
		vscode.window.showInformationMessage('No Go function found above');
		return;
	}

	const docstring = generateDocstring(functionLine);

	editor.edit(editBuilder => {
		// Replace """ with generated docstring
		const replaceRange = new vscode.Range(position.line, position.character - 3, position.line, position.character);
		editBuilder.replace(replaceRange, docstring);
	});
}

export function generateDocstring(functionLine: string): string {
	// Extract function name and params
	const funcRegex = /func\s+(\w+)\((.*?)\)\s*(\((.*?)\)|(\S+))?/;
	const match = functionLine.match(funcRegex);

	if (!match) {
		return '/** Unable to parse the function */';
	}

	const functionName = match[1]; // function name
	const args = match[2].trim(); // function arguments
	const returnTypesGroup = match[4] || match[5]; // handles multiple or single return types

	// Parse arguments
	let paramList: string[] = [];
	if (args) {
		// Generate parameter description
		paramList = args.split(',').map((param) => {
			const [name, type] = param.trim().split(/\s+/);
			return `    ${name || 'param'} (${type || 'type'}): [Description]`;
		});
	}

	// Parse return types
	let returnList: string[] = [];
	if (returnTypesGroup && returnTypesGroup.trim()) {
		const returnTypes = returnTypesGroup.split(',').map((ret) => ret.trim());
		returnList = returnTypes
			.filter((ret) => ret !== '{')
			.map((ret, index) => `    return${index+1} (${ret}): [Description]`);
	}
	
	// build the docstring
	let docstring = `/**\n`;
	docstring += ` * ${functionName}: [Description]\n *\n`;

	// Add args section if exists
	if (paramList.length > 0) {
		docstring += ` * Args:\n`;
		paramList.forEach(param => {
			docstring += ` * ${param}\n`;
		});
	}

	// Add returns section if exists
	if (returnList.length > 0) {
		docstring += ` *\n * Returns:\n`;
		returnList.forEach((ret) => {
			docstring += ` * ${ret}\n`;
		});
	}

	docstring += ` */`;
	return docstring;
}

// This method is called when your extension is deactivated
export function deactivate() {}
