"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.generateDocstring = generateDocstring;
exports.deactivate = deactivate;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(require("vscode"));
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    let timeout;
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
function generateAndInsertDosctring(editor, position) {
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
function generateDocstring(functionLine) {
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
    let paramList = [];
    if (args) {
        // Generate parameter description
        paramList = args.split(',').map((param) => {
            const [name, type] = param.trim().split(/\s+/);
            return `    ${name || 'param'} (${type || 'type'}): [Description]`;
        });
    }
    // Parse return types
    let returnList = [];
    if (returnTypesGroup && returnTypesGroup.trim()) {
        const returnTypes = returnTypesGroup.split(',').map((ret) => ret.trim());
        returnList = returnTypes
            .filter((ret) => ret !== '{')
            .map((ret, index) => `    return${index + 1} (${ret}): [Description]`);
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
function deactivate() { }
//# sourceMappingURL=extension.js.map