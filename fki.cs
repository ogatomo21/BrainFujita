using System;
using System.IO;
using System.Text;

public static class Program
{
	public static int Main(string[] args)
	{
		try
		{
			return Run(args);
		}
		catch (BrainFujita.SyntaxException ex)
		{
			WriteSyntaxError(ex.Message);
			return 1;
		}
		catch (IOException ex)
		{
			Console.Error.WriteLine("入出力エラー: " + ex.Message);
			return 1;
		}
		catch (Exception ex)
		{
			Console.Error.WriteLine("エラー: " + ex.Message);
			return 1;
		}
	}

	private static int Run(string[] args)
	{
		if (args.Length == 1 && string.Equals(args[0], "--version", StringComparison.OrdinalIgnoreCase))
		{
			WriteHeader();
			return 0;
		}

		if (args.Length != 1)
		{
			PrintUsage();
			return 1;
		}

		string inputPath = args[0];
		string source = BrainFujita.ReadAllText(inputPath);
		BrainFujita.ExecutionMode executionMode;
		string body = BrainFujita.StripExecutionShebang(source, out executionMode);

		if (executionMode == BrainFujita.ExecutionMode.Utf8Extended)
		{
			Console.InputEncoding = new UTF8Encoding(false);
			Console.OutputEncoding = new UTF8Encoding(false);

			Stream inputStream = Console.OpenStandardInput();
			Stream outputStream = Console.OpenStandardOutput();
			Func<int> utf8ByteInput = () => inputStream.ReadByte();
			Action<byte> utf8ByteWrite = value => outputStream.WriteByte(value);

			BrainFujita.ExecuteBrainfuck(BrainFujita.ConvertToBrainfuck(body), utf8ByteInput, utf8ByteWrite);
			outputStream.Flush();
			return 0;
		}

		Stream output = Console.OpenStandardOutput();
		Func<int> byteInput = () => Console.OpenStandardInput().ReadByte();
		Action<byte> byteWrite = value => output.WriteByte(value);

		BrainFujita.ExecuteBrainfujita(source, byteInput, byteWrite);
		output.Flush();
		return 0;
	}

	private static void WriteHeader()
	{
		Console.WriteLine("fki (Fujita Kotone Interpreter) version " + BrainFujita.GetVersion());
		Console.WriteLine("Copyright (C) 2026 Tomoya Ogawa. All rights reserved.");
		Console.WriteLine("Repo: https://github.com/ogatomo21/BrainFujita");
	}

	private static void PrintUsage()
	{
		Console.WriteLine("Usage:");
		Console.WriteLine("  fki.exe input.kf");
	}

	private static void WriteSyntaxError(string message)
	{
		Console.ForegroundColor = ConsoleColor.Red;
		Console.Error.WriteLine("=== 許しませんよ藤田ことね... (構文エラー) ===");
		Console.ResetColor();
		Console.Error.WriteLine("構文エラー: " + message);
	}
}
