using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using System.Text;

[assembly: AssemblyVersion("1.0.0")]

public static class BrainFujita
{
	public enum ExecutionMode
	{
		Standard,
		Utf8Extended
	}

	private struct Token
	{
		public readonly string Text;
		public readonly char Brainfuck;

		public Token(string text, char brainfuck)
		{
			Text = text;
			Brainfuck = brainfuck;
		}
	}

	private struct SourcePosition
	{
		public readonly int Index;
		public readonly int Line;
		public readonly int Column;

		public SourcePosition(int index, int line, int column)
		{
			Index = index;
			Line = line;
			Column = column;
		}
	}

	public sealed class SyntaxException : Exception
	{
		public SyntaxException(string message) : base(message)
		{
		}
	}

	private static readonly Token[] ForwardTokens = new Token[]
	{
		new Token("だいしゅき", '<'),
		new Token("しゅき", '>'),
		new Token("セナ？", ']'),
		new Token("ナ？", '['),
		new Token("せーの", '.'),
		new Token("ことね", ','),
		new Token("セナー", '-'),
		new Token("ナー", '+')
	};

	private static readonly Dictionary<char, string> ReverseTokens = new Dictionary<char, string>
	{
		{ '>', "しゅき" },
		{ '<', "だいしゅき" },
		{ '+', "ナー" },
		{ '-', "セナー" },
		{ '.', "せーの" },
		{ ',', "ことね" },
		{ '[', "ナ？" },
		{ ']', "セナ？" }
	};

	private static readonly Dictionary<char, char> HankakuKatakanaMap = new Dictionary<char, char>
	{
		{ '\uFF71', '\u3042' }, { '\uFF72', '\u3044' }, { '\uFF73', '\u3046' }, { '\uFF74', '\u3048' }, { '\uFF75', '\u304A' },
		{ '\uFF76', '\u304B' }, { '\uFF77', '\u304D' }, { '\uFF78', '\u304F' }, { '\uFF79', '\u3051' }, { '\uFF7A', '\u3053' },
		{ '\uFF7B', '\u3055' }, { '\uFF7C', '\u3057' }, { '\uFF7D', '\u3059' }, { '\uFF7E', '\u305B' }, { '\uFF7F', '\u305D' },
		{ '\uFF80', '\u305F' }, { '\uFF81', '\u3061' }, { '\uFF82', '\u3064' }, { '\uFF83', '\u3066' }, { '\uFF84', '\u3068' },
		{ '\uFF85', '\u306A' }, { '\uFF86', '\u306B' }, { '\uFF87', '\u306C' }, { '\uFF88', '\u306D' }, { '\uFF89', '\u306E' },
		{ '\uFF8A', '\u306F' }, { '\uFF8B', '\u3072' }, { '\uFF8C', '\u3075' }, { '\uFF8D', '\u3078' }, { '\uFF8E', '\u307B' },
		{ '\uFF8F', '\u307E' }, { '\uFF90', '\u307F' }, { '\uFF91', '\u3080' }, { '\uFF92', '\u3081' }, { '\uFF93', '\u3082' },
		{ '\uFF94', '\u3084' }, { '\uFF95', '\u3086' }, { '\uFF96', '\u3088' },
		{ '\uFF97', '\u3089' }, { '\uFF98', '\u308A' }, { '\uFF99', '\u308B' }, { '\uFF9A', '\u308C' }, { '\uFF9B', '\u308D' },
		{ '\uFF9C', '\u308F' }, { '\uFF9D', '\u3093' }
	};

	public static string GetVersion()
	{
		return typeof(BrainFujita).Assembly.GetName().Version.ToString(3);
	}

	public static string ReadAllText(string path)
	{
		if (!File.Exists(path))
		{
			throw new IOException("ファイルが見つかりません: " + path);
		}

		return File.ReadAllText(path, new UTF8Encoding(false));
	}

	public static string StripExecutionShebang(string source, out ExecutionMode executionMode)
	{
		executionMode = ExecutionMode.Standard;

		int startIndex = 0;
		if (source.Length > 0 && source[0] == '\uFEFF')
		{
			startIndex = 1;
		}

		if (MatchesShebang(source, startIndex, "#!自己肯定感爆上げちゅ～↑↑") || MatchesShebang(source, startIndex, "#!自己肯定感爆上げ中"))
		{
			executionMode = ExecutionMode.Utf8Extended;
			return RemoveFirstLine(source, startIndex);
		}

		return source;
	}

	public static string StripExecutionShebang(string source, out bool utf8ExtendedMode)
	{
		ExecutionMode executionMode;
		string body = StripExecutionShebang(source, out executionMode);
		utf8ExtendedMode = executionMode == ExecutionMode.Utf8Extended;
		return body;
	}

	public static string ConvertToBrainfuck(string source)
	{
		StringBuilder result = new StringBuilder();
		List<SourcePosition> bracketStack = new List<SourcePosition>();
		int index = 0;
		int line = 1;
		int column = 1;

		while (index < source.Length)
		{
			char current = source[index];

			if (char.IsWhiteSpace(current))
			{
				AdvancePosition(current, ref line, ref column);
				index++;
				continue;
			}

			Token matchedToken = default(Token);
			bool matched = false;

			for (int tokenIndex = 0; tokenIndex < ForwardTokens.Length; tokenIndex++)
			{
				Token token = ForwardTokens[tokenIndex];
				if (MatchesAt(source, index, token.Text))
				{
					matchedToken = token;
					matched = true;
					break;
				}
			}

			if (!matched)
			{
				AdvancePosition(current, ref line, ref column);
				index++;
				continue;
			}

			result.Append(matchedToken.Brainfuck);

			if (matchedToken.Brainfuck == '[')
			{
				bracketStack.Add(new SourcePosition(index, line, column));
			}
			else if (matchedToken.Brainfuck == ']')
			{
				if (bracketStack.Count == 0)
				{
					throw new SyntaxException(FormatPositionMessage(line, column, "対応する `ナ？` がありません"));
				}

				bracketStack.RemoveAt(bracketStack.Count - 1);
			}

			for (int tokenOffset = 0; tokenOffset < matchedToken.Text.Length; tokenOffset++)
			{
				AdvancePosition(matchedToken.Text[tokenOffset], ref line, ref column);
			}

			index += matchedToken.Text.Length;
		}

		if (bracketStack.Count > 0)
		{
			SourcePosition position = bracketStack[bracketStack.Count - 1];
			throw new SyntaxException(FormatPositionMessage(position.Line, position.Column, "対応する `セナ？` がありません"));
		}

		return result.ToString();
	}

	public static string ConvertToBrainFujita(string source)
	{
		StringBuilder result = new StringBuilder();
		List<SourcePosition> bracketStack = new List<SourcePosition>();
		int line = 1;
		int column = 1;

		for (int index = 0; index < source.Length; index++)
		{
			char current = source[index];

			if (char.IsWhiteSpace(current))
			{
				AdvancePosition(current, ref line, ref column);
				continue;
			}

			string token;
			if (!ReverseTokens.TryGetValue(current, out token))
			{
				AdvancePosition(current, ref line, ref column);
				continue;
			}

			result.Append(token);

			if (current == '[')
			{
				bracketStack.Add(new SourcePosition(index, line, column));
			}
			else if (current == ']')
			{
				if (bracketStack.Count == 0)
				{
					throw new SyntaxException(FormatPositionMessage(line, column, "対応する `[` がありません"));
				}

				bracketStack.RemoveAt(bracketStack.Count - 1);
			}

			AdvancePosition(current, ref line, ref column);
		}

		if (bracketStack.Count > 0)
		{
			SourcePosition position = bracketStack[bracketStack.Count - 1];
			throw new SyntaxException(FormatPositionMessage(position.Line, position.Column, "対応する `]` がありません"));
		}

		return result.ToString();
	}

	public static void ExecuteBrainfujita(string source, Func<int> input, Action<byte> output)
	{
		ExecutionMode executionMode;
		string body = StripExecutionShebang(source, out executionMode);
		ExecuteBrainfuck(ConvertToBrainfuck(body), input, output);
	}

	public static void ExecuteBrainfujita(string source, Func<int> byteInput, Action<byte> byteOutput, Func<int> utf8Input, Action<int> utf8Output)
	{
		ExecutionMode executionMode;
		string body = StripExecutionShebang(source, out executionMode);
		string brainfuck = ConvertToBrainfuck(body);

		ExecuteBrainfuck(brainfuck, byteInput, byteOutput);
	}

	public static void ExecuteBrainfuck(string source, Func<int> input, Action<byte> output)
	{
		Dictionary<int, int> jumpMap = BuildJumpMap(source);
		List<byte> tape = new List<byte> { 0 };
		int pointer = 0;

		for (int instructionPointer = 0; instructionPointer < source.Length; instructionPointer++)
		{
			char instruction = source[instructionPointer];

			switch (instruction)
			{
				case '>':
					pointer++;
					if (pointer >= tape.Count)
					{
						tape.Add(0);
					}
					break;
				case '<':
					if (pointer == 0)
					{
						tape.Insert(0, 0);
					}
					else
					{
						pointer--;
					}
					break;
				case '+':
					tape[pointer] = (byte)((tape[pointer] + 1) & 0xFF);
					break;
				case '-':
					tape[pointer] = (byte)((tape[pointer] + 255) & 0xFF);
					break;
				case '.':
					output(tape[pointer]);
					break;
				case ',':
					int inputValue = input();
					tape[pointer] = (byte)(inputValue < 0 ? 0 : inputValue & 0xFF);
					break;
				case '[':
					if (tape[pointer] == 0)
					{
						instructionPointer = jumpMap[instructionPointer];
					}
					break;
				case ']':
					if (tape[pointer] != 0)
					{
						instructionPointer = jumpMap[instructionPointer];
					}
					break;
			}
		}
	}

	public static void ExecuteBrainfuckUtf8(string source, Func<int> input, Action<int> output)
	{
		Dictionary<int, int> jumpMap = BuildJumpMap(source);
		List<int> tape = new List<int> { 0 };
		int pointer = 0;

		for (int instructionPointer = 0; instructionPointer < source.Length; instructionPointer++)
		{
			char instruction = source[instructionPointer];

			switch (instruction)
			{
				case '>':
					pointer++;
					if (pointer >= tape.Count)
					{
						tape.Add(0);
					}
					break;
				case '<':
					if (pointer == 0)
					{
						tape.Insert(0, 0);
					}
					else
					{
						pointer--;
					}
					break;
				case '+':
					tape[pointer]++;
					break;
				case '-':
					tape[pointer]--;
					break;
				case '.':
					output(tape[pointer]);
					break;
				case ',':
					tape[pointer] = input();
					break;
				case '[':
					if (tape[pointer] == 0)
					{
						instructionPointer = jumpMap[instructionPointer];
					}
					break;
				case ']':
					if (tape[pointer] != 0)
					{
						instructionPointer = jumpMap[instructionPointer];
					}
					break;
			}
		}
	}

	private static Dictionary<int, int> BuildJumpMap(string source)
	{
		Dictionary<int, int> jumpMap = new Dictionary<int, int>();
		Stack<int> stack = new Stack<int>();

		for (int index = 0; index < source.Length; index++)
		{
			char instruction = source[index];

			if (instruction == '[')
			{
				stack.Push(index);
			}
			else if (instruction == ']')
			{
				if (stack.Count == 0)
				{
					throw new SyntaxException("Brainfuck の `[` と `]` が対応していません");
				}

				int openIndex = stack.Pop();
				jumpMap[openIndex] = index;
				jumpMap[index] = openIndex;
			}
		}

		if (stack.Count > 0)
		{
			throw new SyntaxException("Brainfuck の `[` と `]` が対応していません");
		}

		return jumpMap;
	}

	private static bool MatchesAt(string source, int index, string token)
	{
		if (index + token.Length > source.Length)
		{
			return false;
		}

		for (int tokenIndex = 0; tokenIndex < token.Length; tokenIndex++)
		{
			if (NormalizeTokenChar(source[index + tokenIndex]) != NormalizeTokenChar(token[tokenIndex]))
			{
				return false;
			}
		}

		return true;
	}

	private static bool MatchesShebang(string source, int startIndex, string shebang)
	{
		if (startIndex + shebang.Length > source.Length)
		{
			return false;
		}

		for (int index = 0; index < shebang.Length; index++)
		{
			if (source[startIndex + index] != shebang[index])
			{
				return false;
			}
		}

		return true;
	}

	private static string RemoveFirstLine(string source, int startIndex)
	{
		int index = startIndex;
		while (index < source.Length && source[index] != '\n' && source[index] != '\r')
		{
			index++;
		}

		if (index < source.Length && source[index] == '\r')
		{
			index++;
			if (index < source.Length && source[index] == '\n')
			{
				index++;
			}
		}
		else if (index < source.Length && source[index] == '\n')
		{
			index++;
		}

		return source.Substring(index);
	}

	private static char NormalizeTokenChar(char current)
	{
		if (current == 'ー' || current == '-' || current == '\uFF70')
		{
			return 'ー';
		}

		if (current == '？' || current == '?' || current == '\uFF1F')
		{
			return '？';
		}

		char hankakuResult;
		if (HankakuKatakanaMap.TryGetValue(current, out hankakuResult))
		{
			return hankakuResult;
		}

		if (current >= 'ァ' && current <= 'ヶ')
		{
			return (char)(current - 0x60);
		}

		return current;
	}

	private static void AdvancePosition(char current, ref int line, ref int column)
	{
		if (current == '\n')
		{
			line++;
			column = 1;
			return;
		}

		if (current == '\r')
		{
			column = 1;
			return;
		}

		column++;
	}

	private static string FormatPositionMessage(int line, int column, string message)
	{
		return string.Format("{0} 行 {1} 列: {2}", line, column, message);
	}
}
