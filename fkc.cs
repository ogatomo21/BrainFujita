using System;
using System.IO;
using System.Text;

public static class Program
{
	public static int Main(string[] args)
	{
		Console.WriteLine("fkc (Fujita Kotone Converter) version " + BrainFujita.GetVersion());
		Console.WriteLine("Copyright (C) 2026 Tomoya Ogawa. All rights reserved.");
		Console.WriteLine("Repo: https://github.com/ogatomo21/BrainFujita");
		Console.WriteLine();

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
		if (args.Length < 2 || args.Length > 3)
		{
			PrintUsage();
			return 1;
		}

		string mode = args[0];
		string inputPath = args[1];
		string outputPath = args.Length >= 3 ? args[2] : GetDefaultOutputPath(mode, inputPath);

		if (string.Equals(mode, "convert", StringComparison.OrdinalIgnoreCase))
		{
			string source = BrainFujita.ReadAllText(inputPath);
			string brainfuck = BrainFujita.ConvertToBrainfuck(source);
			File.WriteAllText(outputPath, brainfuck, new UTF8Encoding(false));
			Console.WriteLine("Converted " + inputPath + " -> " + outputPath);
			return 0;
		}

		if (string.Equals(mode, "revert", StringComparison.OrdinalIgnoreCase))
		{
			string source = BrainFujita.ReadAllText(inputPath);
			string brainfujita = BrainFujita.ConvertToBrainFujita(source);
			File.WriteAllText(outputPath, brainfujita, new UTF8Encoding(false));
			Console.WriteLine("Reverted " + inputPath + " -> " + outputPath);
			return 0;
		}

		PrintUsage();
		return 1;
	}

	private static void PrintUsage()
	{
		Console.WriteLine("Usage:");
		Console.WriteLine("  fkc.exe convert input.kf [output.bf]");
		Console.WriteLine("  fkc.exe revert input.bf [output.kf]");
	}

	private static string GetDefaultOutputPath(string mode, string inputPath)
	{
		string extension = string.Equals(mode, "convert", StringComparison.OrdinalIgnoreCase) ? ".bf" : ".kf";
		string currentExtension = Path.GetExtension(inputPath);

		if (string.Equals(currentExtension, extension, StringComparison.OrdinalIgnoreCase))
		{
			return inputPath;
		}

		if (string.IsNullOrEmpty(currentExtension))
		{
			return inputPath + extension;
		}

		return Path.ChangeExtension(inputPath, extension);
	}

	private static void WriteSyntaxError(string message)
	{
		Console.ForegroundColor = ConsoleColor.Red;
		Console.Error.WriteLine("=== 許しませんよ藤田ことね... (構文エラー) ===");
		Console.ResetColor();
		Console.Error.WriteLine("構文エラー: " + message);
	}
}
