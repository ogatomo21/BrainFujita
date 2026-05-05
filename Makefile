.PHONY: build clean test help

help:
	@echo "BrainFujita - fkc (Fujita Kotone Converter)"
	@echo ""
	@echo "Available targets:"
	@echo "  build     - Compile fkc.exe and fki.exe"
	@echo "  test      - Run a basic conversion test"
	@echo "  clean     - Remove build artifacts"
	@echo "  help      - Show this help message"

build: fkc.exe fki.exe

fkc.exe: fkc.cs BrainFujita.cs
	csc /nologo /t:exe /out:fkc.exe fkc.cs BrainFujita.cs

fki.exe: fki.cs BrainFujita.cs
	csc /nologo /t:exe /out:fki.exe fki.cs BrainFujita.cs

test: fkc.exe
	@echo "Running basic conversion test..."
	@cmd /c "echo ナー> test_input.kf"
	@.\fkc.exe convert test_input.kf
	@cmd /c "if exist test_input.bf (echo Test completed) else exit /b 1"

clean:
	@powershell -NoProfile -Command "Remove-Item -Force fkc.exe, fki.exe, test_input.kf, test_input.bf, fkc_new.exe, fki_new.exe, sample.kf, sample.bf -ErrorAction SilentlyContinue; Write-Host 'Clean completed'"
