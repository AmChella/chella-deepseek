import * as vscode from 'vscode';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('gpt.askAI', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('Open a file first.');
            return;
        }

        const selection = editor.document.getText(editor.selection) || editor.document.getText();

        const prompt = await vscode.window.showInputBox({
            prompt: 'What do you want to ask ChatGPT?',
        });

        if (!prompt) return;

        const apiKey = vscode.workspace.getConfiguration('gpt').get<string>('apiKey');
        if (!apiKey) {
            vscode.window.showErrorMessage('OpenAI API key not set. Please configure gpt.apiKey in your settings.');
            return;
        }

        try {
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are a helpful coding assistant." },
                    { role: "user", content: prompt + "\n\n" + selection }
                ]
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = response.data.choices[0].message.content;
            vscode.window.showInformationMessage(result);
        } catch (error: any) {
            if (error.response?.status === 429) {
                vscode.window.showErrorMessage('Rate limit hit. Please wait and try again.');
            } else {
                vscode.window.showErrorMessage(`Error: ${error.message}`);
            }
        }
    });

    context.subscriptions.push(disposable);
}