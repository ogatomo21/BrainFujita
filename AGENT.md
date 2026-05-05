# BrainFujita Development Log

## Session: 2026-05-06

### Overview
Implemented BrainFujita CLI converter (`fkc`) - a tool to convert between BrainFujita language (.kf) and Brainfuck (.bf).

### Completed Features

#### 1. CLI Interface
- **Commands**:
  - `fkc.exe convert input.kf [output.bf]` - Convert BrainFujita to Brainfuck
  - `fkc.exe revert input.bf [output.kf]` - Convert Brainfuck to BrainFujita
- Output filename auto-generation when not specified
- Proper exit codes (0 for success, 1 for errors)

#### 2. Token Support
- 8 BrainFujita commands mapped to 8 Brainfuck operations
- Full command set from specification implemented

#### 3. Input Normalization
- **Hiragana/Katakana equivalence**: `しゅき` = `シュキ` = `ｼｭｷ`
- **Half-width katakana support**: Full mapping of 46 half-width characters
- **Symbol normalization**:
  - `ナ？` / `セナ？`: `？` (U+FF1F) = `?` (U+003F)
  - `ナー` / `セナー`: `ー` (U+30FC) = `-` (U+002D) = `ｰ` (U+FF70)

#### 4. Error Handling
- Bracket matching validation (`ナ？` ↔ `セナ？`)
- Syntax error reporting with line and column numbers
- Red-colored error header: `=== 許しませんよ藤田ことね... (構文エラー) ===`

#### 5. Header/Version Info
- Program header displayed on every run
- Version managed via `[assembly: AssemblyVersion("x.y.z")]`
- Dynamic version retrieval using Reflection
- Format: `fkc (Fujita Kotone Converter) version 1.0.0`

#### 6. Build Configuration
- Single-file C# implementation (`fkc.cs`)
- Makefile for build automation
- .gitignore for version control

### Implementation Details

**File**: `fkc.cs` (~400 lines)
- `Token` struct for command definitions
- `SourcePosition` struct for error location tracking
- `NormalizeTokenChar()` for input character normalization with full half-width katakana map
- `MatchesAt()` for normalized token matching
- `ConvertToBrainfuck()` and `ConvertToBrainFujita()` for bidirectional conversion
- Bracket stack validation for syntax checking

**Build**: C# compiler (csc.exe) with no external dependencies

### Testing Results
✓ Standard katakana conversion working
✓ Hiragana input accepted
✓ Half-width katakana support verified
✓ Symbol ゆれ (ー/- and ？/?) normalized correctly
✓ Mixed input (hiragana + katakana + half-width) processed correctly
✓ Error messages display with red header
✓ Version from AssemblyVersion attribute correctly retrieved

### Build Instructions
```powershell
# Compile
make build
# or manually
csc /nologo /t:exe /out:fkc.exe fkc.cs

# Test
make test

# Clean
make clean
```

### Future Enhancements
- Interpreter (fki) for direct .kf execution
- Optimization for Brainfuck output
- Extended debugging/tracing mode

## Session: 2026-05-06 Follow-up

### Changes
- Added `BrainFujita.cs` as a shared core for conversion, normalization, version retrieval, and Brainfuck execution.
- Reworked `fkc.cs` into a thin converter CLI wrapper.
- Added `fki.cs` as a BrainFujita interpreter that executes the converted Brainfuck stream directly.
- Updated `Makefile` to build both `fkc.exe` and `fki.exe`.
- Updated `README.md` with `fki` usage and build instructions.

### Notes
- Conversion and interpreter logic now share the same normalization rules for hiragana, full-width katakana, half-width katakana, and symbol variants.
- Syntax errors still print the red header before the detailed message.

## Session: 2026-05-06 Interpreter Follow-up

### Changes
- `BrainFujita.cs` now ignores non-command characters during conversion and execution, matching Brainfuck comment behavior.
- `fki.exe` no longer prints the header on normal runs; it prints the header only for `--version`.
- README updated to describe `fki.exe --version` and comment-handling behavior.

### Verification
- `fkc` conversion with mixed comments now skips non-commands and emits only the recognized instructions.
- `fki --version` prints the header, while normal execution does not.

## Session: 2026-05-06 Final Save

### Final Notes
- Confirmed `fki.exe .\jibaku.kf` runs successfully with no header on normal execution.
- Preserved the shared `BrainFujita.cs` core for both converter and interpreter.
- Kept comment handling aligned with Brainfuck-style non-command character ignoring.

## Session: 2026-05-06 UTF-8 Shebang Mode

### Changes
- Added first-line shebang detection for `#!自己肯定感爆上げちゅ～↑↑` and `#!自己肯定感爆上げ中`.
- When the shebang is present, `fki` switches to the UTF-8 extension mode for I/O.
- Normal `fki` runs still stay headerless; `--version` continues to print the header.

### Verification
- Confirmed `fki` echoes Japanese text correctly in UTF-8 mode.
- Confirmed plain mode still behaves as byte-oriented Brainfuck I/O.

## Session: 2026-05-06 UTF-8 Byte-Mode Migration

### Changes
- Switched UTF-8 extension behavior from Unicode codepoint I/O to UTF-8 byte I/O.
- Updated `BrainFujita.cs` dispatch paths to execute with 8-bit tape semantics in both normal and shebang modes.
- Updated `fki.cs` UTF-8 shebang path to read/write bytes via standard streams with UTF-8 encoding.
- Fixed mojibake-prone output handling by separating console-interactive and redirected stream behavior.
- Updated `README.md` to clarify that `,` and `.` process one byte at a time in UTF-8 mode.

### Verification
- Rebuilt with `csc /nologo /t:exe /out:fki.exe fki.cs BrainFujita.cs`.
- Confirmed interactive run outputs readable Japanese text.
- Confirmed redirected output bytes for sample UTF-8 text match expected UTF-8 byte sequences.
