(() => {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder("utf-8", { fatal: false });

    const halfWidthKatakanaMap = new Map([
        ["ｱ", "あ"], ["ｲ", "い"], ["ｳ", "う"], ["ｴ", "え"], ["ｵ", "お"],
        ["ｶ", "か"], ["ｷ", "き"], ["ｸ", "く"], ["ｹ", "け"], ["ｺ", "こ"],
        ["ｻ", "さ"], ["ｼ", "し"], ["ｽ", "す"], ["ｾ", "せ"], ["ｿ", "そ"],
        ["ﾀ", "た"], ["ﾁ", "ち"], ["ﾂ", "つ"], ["ﾃ", "て"], ["ﾄ", "と"],
        ["ﾅ", "な"], ["ﾆ", "に"], ["ﾇ", "ぬ"], ["ﾈ", "ね"], ["ﾉ", "の"],
        ["ﾊ", "は"], ["ﾋ", "ひ"], ["ﾌ", "ふ"], ["ﾍ", "へ"], ["ﾎ", "ほ"],
        ["ﾏ", "ま"], ["ﾐ", "み"], ["ﾑ", "む"], ["ﾒ", "め"], ["ﾓ", "も"],
        ["ﾔ", "や"], ["ﾕ", "ゆ"], ["ﾖ", "よ"],
        ["ﾗ", "ら"], ["ﾘ", "り"], ["ﾙ", "る"], ["ﾚ", "れ"], ["ﾛ", "ろ"],
        ["ﾜ", "わ"], ["ﾝ", "ん"]
    ]);

    const forwardTokens = [
        { text: "だいしゅき", brainfuck: "<" },
        { text: "しゅき", brainfuck: ">" },
        { text: "セナ？", brainfuck: "]" },
        { text: "ナ？", brainfuck: "[" },
        { text: "せーの", brainfuck: "." },
        { text: "ことね", brainfuck: "," },
        { text: "セナー", brainfuck: "-" },
        { text: "ナー", brainfuck: "+" }
    ];

    const reverseTokens = new Map([
        [">", "しゅき"],
        ["<", "だいしゅき"],
        ["+", "ナー"],
        ["-", "セナー"],
        [".", "せーの"],
        [",", "ことね"],
        ["[", "ナ？"],
        ["]", "セナ？"]
    ]);

    function buildLineColumnMessage(line, column, message) {
        return `行 ${line}, 列 ${column}: ${message}`;
    }

    function normalizeTokenChar(current) {
        if (current === "ー" || current === "-" || current === "ｰ") {
            return "ー";
        }

        if (current === "？" || current === "?") {
            return "？";
        }

        if (halfWidthKatakanaMap.has(current)) {
            return halfWidthKatakanaMap.get(current);
        }

        if (current >= "ァ" && current <= "ヶ") {
            return String.fromCharCode(current.charCodeAt(0) - 0x60);
        }

        return current;
    }

    function advancePosition(current, position) {
        if (current === "\n") {
            position.line += 1;
            position.column = 1;
            return;
        }

        if (current === "\r") {
            position.column = 1;
            return;
        }

        position.column += 1;
    }

    function matchesAt(source, index, token) {
        if (index + token.length > source.length) {
            return false;
        }

        for (let offset = 0; offset < token.length; offset += 1) {
            if (normalizeTokenChar(source[index + offset]) !== normalizeTokenChar(token[offset])) {
                return false;
            }
        }

        return true;
    }

    function matchesShebang(source, startIndex, shebang) {
        if (startIndex + shebang.length > source.length) {
            return false;
        }

        for (let index = 0; index < shebang.length; index += 1) {
            if (source[startIndex + index] !== shebang[index]) {
                return false;
            }
        }

        return true;
    }

    function removeFirstLine(source, startIndex) {
        let index = startIndex;

        while (index < source.length && source[index] !== "\n" && source[index] !== "\r") {
            index += 1;
        }

        if (index < source.length && source[index] === "\r") {
            index += 1;
            if (index < source.length && source[index] === "\n") {
                index += 1;
            }
        } else if (index < source.length && source[index] === "\n") {
            index += 1;
        }

        return source.slice(index);
    }

    function stripExecutionShebang(source) {
        let startIndex = 0;

        if (source.length > 0 && source[0] === "\ufeff") {
            startIndex = 1;
        }

        if (matchesShebang(source, startIndex, "#!自己肯定感爆上げちゅ～↑↑") || matchesShebang(source, startIndex, "#!自己肯定感爆上げ中")) {
            return {
                body: removeFirstLine(source, startIndex),
                utf8ExtendedMode: true
            };
        }

        return {
            body: source,
            utf8ExtendedMode: false
        };
    }

    function convertToBrainfuck(source) {
        let result = "";
        const bracketStack = [];
        const position = { line: 1, column: 1 };

        for (let index = 0; index < source.length; ) {
            const current = source[index];

            if (/\s/.test(current)) {
                advancePosition(current, position);
                index += 1;
                continue;
            }

            let matchedToken = null;
            for (const token of forwardTokens) {
                if (matchesAt(source, index, token.text)) {
                    matchedToken = token;
                    break;
                }
            }

            if (!matchedToken) {
                advancePosition(current, position);
                index += 1;
                continue;
            }

            result += matchedToken.brainfuck;

            if (matchedToken.brainfuck === "[") {
                bracketStack.push({ line: position.line, column: position.column });
            } else if (matchedToken.brainfuck === "]") {
                if (bracketStack.length === 0) {
                    throw new Error(buildLineColumnMessage(position.line, position.column, "対応する `ナ？` がありません"));
                }

                bracketStack.pop();
            }

            for (let offset = 0; offset < matchedToken.text.length; offset += 1) {
                advancePosition(matchedToken.text[offset], position);
            }

            index += matchedToken.text.length;
        }

        if (bracketStack.length > 0) {
            const positionInfo = bracketStack[bracketStack.length - 1];
            throw new Error(buildLineColumnMessage(positionInfo.line, positionInfo.column, "対応する `セナ？` がありません"));
        }

        return result;
    }

    function convertToBrainFujita(source) {
        let result = "";
        const bracketStack = [];
        const position = { line: 1, column: 1 };

        for (let index = 0; index < source.length; index += 1) {
            const current = source[index];

            if (/\s/.test(current)) {
                advancePosition(current, position);
                continue;
            }

            if (!reverseTokens.has(current)) {
                advancePosition(current, position);
                continue;
            }

            result += reverseTokens.get(current);

            if (current === "[") {
                bracketStack.push({ line: position.line, column: position.column });
            } else if (current === "]") {
                if (bracketStack.length === 0) {
                    throw new Error(buildLineColumnMessage(position.line, position.column, "対応する `[` がありません"));
                }

                bracketStack.pop();
            }

            advancePosition(current, position);
        }

        if (bracketStack.length > 0) {
            const positionInfo = bracketStack[bracketStack.length - 1];
            throw new Error(buildLineColumnMessage(positionInfo.line, positionInfo.column, "対応する `]` がありません"));
        }

        return result;
    }

    function buildJumpMap(source) {
        const jumpMap = new Map();
        const stack = [];

        for (let index = 0; index < source.length; index += 1) {
            const instruction = source[index];

            if (instruction === "[") {
                stack.push(index);
            } else if (instruction === "]") {
                if (stack.length === 0) {
                    throw new Error("Brainfuck の `[` と `]` が対応していません");
                }

                const openIndex = stack.pop();
                jumpMap.set(openIndex, index);
                jumpMap.set(index, openIndex);
            }
        }

        if (stack.length > 0) {
            throw new Error("Brainfuck の `[` と `]` が対応していません");
        }

        return jumpMap;
    }

    function bytesToHex(bytes) {
        return bytes.map((value) => value.toString(16).toUpperCase().padStart(2, "0")).join(" ");
    }

    function bytesToLatin1(bytes) {
        let text = "";
        for (const value of bytes) {
            text += String.fromCharCode(value);
        }

        return text;
    }

    function bytesToUtf8Text(bytes) {
        return decoder.decode(new Uint8Array(bytes));
    }

    function bytesFromText(text) {
        return Array.from(encoder.encode(text));
    }

    function formatMemory(tape, pointer, limit = 48) {
        if (tape.length === 0) {
            return {
                cells: [],
                hasLeadingEllipsis: false,
                hasTrailingEllipsis: false
            };
        }

        const safePointer = Math.max(0, Math.min(pointer, tape.length - 1));
        const windowSize = Math.min(limit, tape.length);
        const halfWindow = Math.floor(windowSize / 2);
        let start = Math.max(0, safePointer - halfWindow);
        let end = Math.min(tape.length, start + windowSize);

        if (end - start < windowSize) {
            start = Math.max(0, end - windowSize);
        }

        const cells = [];
        for (let index = start; index < end; index += 1) {
            cells.push({
                index,
                value: tape[index],
                active: index === safePointer
            });
        }

        return {
            cells,
            hasLeadingEllipsis: start > 0,
            hasTrailingEllipsis: end < tape.length
        };
    }

    function executeBrainfuck(source, inputBytes = []) {
        const jumpMap = buildJumpMap(source);
        const tape = [0];
        let pointer = 0;
        let inputIndex = 0;
        const outputBytes = [];

        for (let instructionPointer = 0; instructionPointer < source.length; instructionPointer += 1) {
            const instruction = source[instructionPointer];

            switch (instruction) {
                case ">":
                    pointer += 1;
                    if (pointer >= tape.length) {
                        tape.push(0);
                    }
                    break;
                case "<":
                    if (pointer === 0) {
                        tape.unshift(0);
                    } else {
                        pointer -= 1;
                    }
                    break;
                case "+":
                    tape[pointer] = (tape[pointer] + 1) & 0xff;
                    break;
                case "-":
                    tape[pointer] = (tape[pointer] + 255) & 0xff;
                    break;
                case ".":
                    outputBytes.push(tape[pointer]);
                    break;
                case ",": {
                    const inputValue = inputIndex < inputBytes.length ? inputBytes[inputIndex] : -1;
                    inputIndex += 1;
                    tape[pointer] = inputValue < 0 ? 0 : inputValue & 0xff;
                    break;
                }
                case "[":
                    if (tape[pointer] === 0) {
                        instructionPointer = jumpMap.get(instructionPointer);
                    }
                    break;
                case "]":
                    if (tape[pointer] !== 0) {
                        instructionPointer = jumpMap.get(instructionPointer);
                    }
                    break;
                default:
                    break;
            }
        }

        return {
            tape,
            pointer,
            outputBytes
        };
    }

    function executeBrainFujita(source, inputText = "") {
        const shebangInfo = stripExecutionShebang(source);
        const brainfuck = convertToBrainfuck(shebangInfo.body);
        const inputBytes = bytesFromText(inputText);
        const execution = executeBrainfuck(brainfuck, inputBytes);

        return {
            brainfuck,
            utf8ExtendedMode: shebangInfo.utf8ExtendedMode,
            modeLabel: shebangInfo.utf8ExtendedMode ? "UTF-8 拡張モード" : "標準モード",
            ...execution,
            outputText: shebangInfo.utf8ExtendedMode ? bytesToUtf8Text(execution.outputBytes) : bytesToLatin1(execution.outputBytes)
        };
    }

    function buildStandardOutputBytes(result, utf8ExtendedMode) {
        if (result.outputBytes && result.outputBytes.length > 0) {
            return result.outputBytes.slice();
        }

        if (typeof result.stdoutText === "string") {
            return utf8ExtendedMode ? bytesFromText(result.stdoutText) : bytesFromText(result.stdoutText);
        }

        return [];
    }

    window.BrainFujitaCore = {
        bytesFromText,
        bytesToHex,
        bytesToLatin1,
        bytesToUtf8Text,
        buildStandardOutputBytes,
        convertToBrainFujita,
        convertToBrainfuck,
        executeBrainFujita,
        executeBrainfuck,
        formatMemory,
        stripExecutionShebang
    };
})();
