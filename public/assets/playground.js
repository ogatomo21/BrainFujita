(() => {
    const core = window.BrainFujitaCore;

    const samples = {
        hello: {
            label: "hello-world.kf",
            source: "ナーナーナーナーナーナーナーナーナーナーナ？しゅきナーナーナーナーナーナーナーしゅきナーナーナーナーナーナーナーナーナーナーしゅきナーナーナーしゅきナーだいしゅきだいしゅきだいしゅきだいしゅきセナーセナ？しゅきナーナーせーのしゅきナーせーのナーナーナーナーナーナーナーせーのせーのナーナーナーせーのしゅきナーナーせーのだいしゅきだいしゅきナーナーナーナーナーナーナーナーナーナーナーナーナーナーナーせーのしゅきせーのナーナーナーせーのセナーセナーセナーセナーセナーセナーせーのセナーセナーセナーセナーセナーセナーセナーセナーせーのしゅきナーせーのしゅきせーの"
        },
        kotone: {
            label: "kotone.kf",
            source: "# Fujita Kotoneと出力\n\nナーナーナーナーナーナーナーナーナ？しゅきナーナーナーナーナーナーナーナーナーだいしゅきセナーセナ？しゅきセナーセナーせーの\nだいしゅきナーナーナーナーナーナーナーナ？しゅきナーナーナーナーナーナーナーだいしゅきセナーセナ？しゅきセナーセナーせーの\nだいしゅきナーナーナーナーナ？しゅきセナーセナーセナーだいしゅきセナーセナ？しゅきナーせーの\nセナーせーの\nだいしゅきナーナーナーナーナーナ？しゅきナーナーだいしゅきセナーセナ？しゅきナーせーの\nだいしゅきナーナーナーナーナ？しゅきセナーセナーセナーセナーセナーだいしゅきセナーセナ？しゅきナーせーの\nだいしゅきナーナーナーナーナーナーナ？しゅきセナーセナーセナーセナーセナーセナーセナーセナーセナーセナーセナーだいしゅきセナーセナ？しゅきナーせーの\nだいしゅきナーナーナーナーナーナ？しゅきナーナーナーナーナーナーナーナーナーだいしゅきセナーセナ？しゅきセナーセナーせーの\nだいしゅきナーナーナーナーナーナ？しゅきナーナーナーナーナーナーナーだいしゅきセナーセナ？しゅきナーせーの\nしゅきナーナーナーナーナーナーナーナーナーナーナ？しゅきナーナーナーナーナーナーナーナーナーナーナーだいしゅきセナーセナ？しゅきナーナーナーナーナーナーせーの\nだいしゅきだいしゅきせーの\nセナーせーの\nだいしゅきナーナーナーナーナーナ？しゅきセナーセナーだいしゅきセナーセナ？しゅきナーせーの"
        }
    };

    const sourceInput = document.getElementById("sourceInput");
    const stdinInput = document.getElementById("stdinInput");
    const stdoutOutput = document.getElementById("stdoutOutput");
    const stdoutBytes = document.getElementById("stdoutBytes");
    const memoryView = document.getElementById("memoryView");
    const sampleSelect = document.getElementById("sampleSelect");
    const sampleLoadButton = document.getElementById("sampleLoadButton");
    const fileInput = document.getElementById("fileInput");
    const executeButton = document.getElementById("executeButton");
    const convertButton = document.getElementById("convertButton");
    const clearButton = document.getElementById("clearButton");
    const statusDot = document.getElementById("statusDot");
    const modeBadge = document.getElementById("modeBadge");
    const stdoutBytesCount = document.getElementById("stdoutBytesCount");
    const pointerBadge = document.getElementById("pointerBadge");
    const stdoutHint = document.getElementById("stdoutHint");

    function setStatus(ok) {
        if (!statusDot) return;
        if (ok) {
            statusDot.classList.remove('bg-red-500','ring-red-200');
            statusDot.classList.add('bg-green-500','ring-green-200');
        } else {
            statusDot.classList.remove('bg-green-500','ring-green-200');
            statusDot.classList.add('bg-red-500','ring-red-200');
        }
    }

    function setStdout(text) {
        if (!stdoutOutput) return;
        stdoutOutput.value = text;
    }

    function setBytes(bytes) {
        if (!stdoutBytes) return;
        stdoutBytes.value = core.bytesToHex(bytes);
        if (stdoutBytesCount) stdoutBytesCount.textContent = `${bytes.length} bytes`;
    }

    function setMode(modeLabel) {
        if (!modeBadge) return;
        modeBadge.textContent = modeLabel;
    }

    function renderMemory(result) {
        memoryView.innerHTML = "";

        if (!result || !result.tape || result.tape.length === 0) {
            memoryView.innerHTML = '<div class="text-sm text-[#6a5f3c]">メモリはまだありません。</div>';
            if (pointerBadge) pointerBadge.textContent = "pointer -";
            return;
        }

        const memory = core.formatMemory(result.tape, result.pointer);

        // Leading ellipsis
        if (memory.hasLeadingEllipsis) {
            const ellipsis = document.createElement("div");
            ellipsis.className = "text-sm text-[#6a5f3c]";
            ellipsis.textContent = "...";
            memoryView.appendChild(ellipsis);
        }

        // Inline grouped 4-digit zero-padded values
        const line = document.createElement("div");
        line.className = "flex gap-2 flex-wrap items-center font-mono";

        for (const cell of memory.cells) {
            const span = document.createElement("div");
            span.style.minWidth = '56px';
            span.style.padding = '6px 8px';
            span.style.borderRadius = '8px';
            span.style.border = '1px solid rgba(0,0,0,0.06)';
            span.style.background = '#fffef8';
            span.style.fontWeight = '800';
            span.style.textAlign = 'center';
            if (cell.active) {
                span.style.background = '#fff4bf';
                span.style.borderColor = '#d39a00';
                span.style.boxShadow = '0 8px 16px rgba(248,193,18,0.12)';
            }
            const formatted = String(cell.value).padStart(4, "0");
            span.textContent = formatted;
            line.appendChild(span);
        }

        memoryView.appendChild(line);

        // Trailing ellipsis
        if (memory.hasTrailingEllipsis) {
            const ellipsis = document.createElement("div");
            ellipsis.className = "text-sm text-[#6a5f3c]";
            ellipsis.textContent = "...";
            memoryView.appendChild(ellipsis);
        }

        if (pointerBadge) pointerBadge.textContent = `pointer ${result.pointer}`;
    }

    function clearOutputs() {
        setStdout("");
        setBytes([]);
        renderMemory(null);
        if (stdoutHint) stdoutHint.textContent = "実行結果や変換結果、エラーはここに出ます。";
    }

    function showError(error) {
        const message = error instanceof Error ? error.message : String(error);
        const text = `=== 構文エラー ===\n${message}`;
        setStatus(false);
        setStdout(text);
        setBytes(core.bytesFromText(text));
        memoryView.innerHTML = '<div class="text-sm text-[#6a5f3c]">エラーのためメモリは表示していません。</div>';
        if (pointerBadge) pointerBadge.textContent = "pointer -";
        if (stdoutHint) stdoutHint.textContent = "エラーメッセージは標準出力に表示されます。";
    }

    function runProgram() {
        try {
            const result = core.executeBrainFujita(sourceInput.value, stdinInput.value || "");
            setStatus(true);
            setMode(result.modeLabel);
            setStdout(result.outputText && result.outputText.length > 0 ? result.outputText : "(出力なし)");
            setBytes(result.outputBytes || []);
            renderMemory(result);
            if (stdoutHint) stdoutHint.textContent = "標準出力は実行結果のみを表示します。";
        } catch (error) {
            showError(error);
        }
    }

    function convertProgram() {
        try {
            const shebangInfo = core.stripExecutionShebang(sourceInput.value);
            const compiled = core.convertToBrainfuck(shebangInfo.body);
            setStatus(true);
            setMode(shebangInfo.utf8ExtendedMode ? "UTF-8 拡張モード" : "標準モード");
            setStdout(compiled || "(変換結果なし)");
            setBytes(core.bytesFromText(compiled || ""));
            memoryView.innerHTML = '<div class="text-sm text-[#6a5f3c]">変換時はメモリを表示しません。</div>';
            if (pointerBadge) pointerBadge.textContent = "pointer -";
            if (stdoutHint) stdoutHint.textContent = "BrainFujita から Brainfuck への変換結果です。";
        } catch (error) {
            showError(error);
        }
    }

    function loadSample(name) {
        const sample = samples[name] || samples.hello;
        sourceInput.value = sample.source;
        runProgram();
    }

    function clearAll() {
        sourceInput.value = "";
        stdinInput.value = "";
        clearOutputs();
        setStatus(true);
        setMode("標準モード");
        if (stdoutBytesCount) stdoutBytesCount.textContent = "0 bytes";
        if (stdoutHint) stdoutHint.textContent = "ソースを書いて実行してください。";
    }

    function init() {
        if (sampleLoadButton) sampleLoadButton.addEventListener("click", () => loadSample(sampleSelect.value));
        if (fileInput) fileInput.addEventListener("change", async () => {
            const file = fileInput.files && fileInput.files[0];
            if (!file) return;
            sourceInput.value = await file.text();
            runProgram();
            fileInput.value = "";
        });
        if (executeButton) executeButton.addEventListener("click", runProgram);
        if (convertButton) convertButton.addEventListener("click", convertProgram);
        if (clearButton) clearButton.addEventListener("click", clearAll);
        if (sourceInput) sourceInput.addEventListener("keydown", (event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                runProgram();
            }
        });

        loadSample("hello");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
