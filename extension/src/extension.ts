import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('BrainFujita formatter is now active! 自己肯定感爆上げ中！');

    const formatter = vscode.languages.registerDocumentFormattingEditProvider('brainfujita', {
        provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
            let text = document.getText();
            
            // --- 1. 改行ルールの適用 ---
            const nextCmd = '(?=(しゅき|だいしゅき|な[ー\\-ｰ]|せな[ー\\-ｰ]|せ[ー\\-ｰ][のノﾉ]|ことね|な[？?]|せな[？?]))';
            
            // 「せーの」の直後に改行
            const regexSeeno = new RegExp(`(せ[ー\\-ｰ][のノﾉ])${nextCmd}`, 'g');
            text = text.replace(regexSeeno, "$1\n");
            
            // 「セナ？」は独立させたいので前後に改行（※先に処理すると安全です）
            const regexSenaPre = new RegExp(`([^\\n\\s])(せな[？?]|セナ[？?]|ｾﾅ[？?])`, 'g');
            const regexSenaPost = new RegExp(`(せな[？?]|セナ[？?]|ｾﾅ[？?])${nextCmd}`, 'g');
            text = text.replace(regexSenaPre, "$1\n$2");
            text = text.replace(regexSenaPost, "$1\n");

            // 「ナ？」は独立させたいので前後に改行
            // （★修正：[^...] の中に「せセｾ」を含めることで、直前がセの場合は絶対にマッチさせない）
            const regexNaPre = new RegExp(`([^\\n\\sせセｾ])(な[？?]|ナ[？?]|ﾅ[？?])`, 'g');
            const regexNaPost = new RegExp(`(?<!せ|セ|ｾ)(な[？?]|ナ[？?]|ﾅ[？?])${nextCmd}`, 'g');
            text = text.replace(regexNaPre, "$1\n$2");
            text = text.replace(regexNaPost, "$1\n");

            // --- 2. インデントルールの適用 ---
            const lines = text.split(/\r?\n/);
            let formattedLines: string[] = [];
            let indentLevel = 0;
            const indentStr = '  '; // 指定のスペース2個

            for (let line of lines) {
                line = line.trim(); // 一旦前後の空白をリセット
                if (line === '') {
                    formattedLines.push('');
                    continue;
                }

                // 行頭が「セナ？」(ループ終了) なら、まずインデントレベルを下げる
                if (/^(せな|セナ|ｾﾅ)[？?]/.test(line)) {
                    indentLevel = Math.max(0, indentLevel - 1);
                }

                // インデントを付与して行を保存
                formattedLines.push(indentStr.repeat(indentLevel) + line);

                // 行の中に「ナ？」(ループ開始) が含まれていたら、次の行からインデントレベルを上げる
                if (/(な|ナ|ﾅ)[？?]/.test(line)) {
                    indentLevel++;
                }
            }

            // --- 3. ドキュメント全体の置き換え ---
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(document.getText().length)
            );
            return [vscode.TextEdit.replace(fullRange, formattedLines.join('\n'))];
        }
    });

    context.subscriptions.push(formatter);
}

export function deactivate() {}
