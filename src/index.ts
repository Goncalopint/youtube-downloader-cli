import { program } from "commander";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import cliProgress from "cli-progress";
import chalk from 'chalk';

const log = console.log;

/**
 * Sanitizes a filename by removing invalid characters and replacing spaces with underscores.
 * Limits the filename length to 100 characters.
 * @param {string} filename - The original filename to sanitize.
 * @returns {string} - The sanitized filename.
 */
function sanitizeFilename(filename: string): string {
    return filename
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 100);
}

let progressBar: cliProgress.SingleBar | null = null;

program
    .name("ytvd")
    .description("Youtube Video Downloader")
    .version("1.0.0")
    .usage('"<url>" --video | --audio --output "<path>"')
    .addHelpText(
        "after",
        `
⚠️  IMPORTANTE:
   Coloca o URL entre aspas, especialmente no PowerShell, onde o símbolo "&" causa erro.

Exemplo:
   ytvd "https://youtube.com/watch?v=abc123&ab_channel=Exemplo" --video --output "C:\\Users\\tu\\Downloads"
`
    );

program
    .argument("<url>", "URL do vídeo do YouTube")
    .option("--video", "Baixar vídeo")
    .option("--audio", "Baixar apenas áudio")
    .option("--output <path>", "Caminho obrigatório para salvar o arquivo")
    .action((url, options) => {
        try {
            const downloadType = options.video ? "video" : options.audio ? "audio" : null;
            const output = options.output;

            if (!downloadType) {
                // console.error("❌ Tens de indicar --video ou --audio.\n");
                log(chalk.red('[ERROR]') + ' ❌ Tens de indicar --video ou --audio.');
                program.help({ error: true });
            }

            if (!output) {
                log(chalk.red('[ERROR]') + ' ❌ Tens de indicar o caminho de saída com --output <path>.');
                program.help({ error: true });
            }

            if (!/^https?:\/\/.+/.test(url)) {
                log(chalk.red('[ERROR]') + ' ❌ URL inválido. Usa aspas se tiver caracteres especiais.');
                log(chalk.gray('   Exemplo: ytvd "https://youtube.com/watch?v=abc123" --video --output "C:\\Users\\XYZ\\Downloads"\n'));
                return;
            }

            // console.log(`[DEBUG] 🔍 ${downloadType === "video" ? "A fazer download do vídeo e do áudio" : "A fazer download do áudio"} do url: ${url}`);
            log(chalk.blue('\n[DEBUG]') + ' 🔍 A obter metadata do url...');

            const metadataProcess = spawn("yt-dlp", ["--dump-json", url]);
            let jsonOutput = "", stderrOutput = "";

            metadataProcess.stdout.on("data", (data) => {
                jsonOutput += data.toString();
            });

            metadataProcess.stderr.on("data", (data) => {
                stderrOutput += data.toString();
            });

            metadataProcess.on("close", (code) => {
                if (code !== 0 || !jsonOutput) {
                    // console.error("[yt-dlp stderr]", stderrOutput);
                    log(chalk.red('\n"[yt-dlp stderr]"') + stderrOutput);

                    log(chalk.red('\n[ERROR]') + ' ❌ Falha ao obter metadata.');
                    return;
                }

                let videoTitle = "video";
                try {
                    const metadata = JSON.parse(jsonOutput);
                    // console.log('[DEBUG] ✅ Metadata obtida com sucesso');
                    log(chalk.green('\n[DEBUG]') + ' ✅ Metadata obtida com sucesso');

                    // console.log(`[DEBUG] ✅ Title: ${metadata.title}`);
                    videoTitle = sanitizeFilename(metadata.title);
                } catch {
                    // console.warn("⚠️ Erro ao ler título do vídeo. Usando nome genérico.");
                    log(chalk.yellow('\n[DEBUG]') + ' ⚠️ Erro ao ler título do vídeo. Usando nome genérico.');
                }

                const fileExtension = downloadType === "audio" ? "m4a" : "mp4";
                const outputPath = path.join(output, `${videoTitle}.${fileExtension}`);
                log(chalk.blue('\n[DEBUG]') + ` 🚀 A guardar ficheiro em: ${outputPath}`);

                const ytdlpArgs = downloadType === "audio"
                    ? ["-f", "bestaudio[ext=m4a]/bestaudio", "--extract-audio", "--audio-format", "m4a", "-o", outputPath, url]
                    : ["-f", "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best", "--merge-output-format", "mp4", "-o", outputPath, url];


                log(chalk.blue('\n[DEBUG]') + ` 🚀 A iniciar download...\n`);

                const downloadProcess = spawn("yt-dlp", ytdlpArgs);
                let progressBarInitialized = false;

                downloadProcess.stdout.on("data", (data) => {
                    const output = data.toString();
                    const lines = output.split('\n');

                    for (const line of lines) {
                        if (line.trim()) {
                            // Parse standard yt-dlp progress format: "  5.8% of  137.45MiB at    3.82MiB/s"
                            const progressMatch = line.match(/^\s*([\d.]+)%\s+of\s+([\d.]+\w+)\s+at\s+([\w\d.\/\s]+)$/);

                            if (progressMatch) {
                                const percentage = parseFloat(progressMatch[1]);
                                const totalSize = progressMatch[2];
                                const speed = progressMatch[3].trim();

                                // Initialize progress bar on first progress update
                                if (!progressBarInitialized) {
                                    progressBar = new cliProgress.SingleBar({
                                        format: '📥 Download |{bar}| {percentage}% | {speed} | {size}',
                                        barCompleteChar: '\u2588',
                                        barIncompleteChar: '\u2591',
                                        hideCursor: true,
                                        stopOnComplete: true,
                                        clearOnComplete: false
                                    }, cliProgress.Presets.shades_classic);

                                    progressBar.start(100, 0, {
                                        speed: '0 B/s',
                                        size: 'calculando...'
                                    });
                                    progressBarInitialized = true;
                                }

                                if (progressBar) {
                                    progressBar.update(Math.floor(percentage), {
                                        speed: speed !== 'Unknown B/s' ? speed : 'calculando...',
                                        size: totalSize
                                    });
                                }
                            } else {
                                // Show other yt-dlp output that's not progress
                                if (!line.match(/^\s*[\d.]+%\s+of/) &&
                                    !line.includes('[download]') &&
                                    !line.includes('[Merger]') &&
                                    !line.includes('Deleting original file')) {
                                    console.log(line);
                                }
                            }
                        }
                    }
                });

                downloadProcess.stderr.on("data", (data) => {
                    const output = data.toString();
                    const lines = output.split('\n');

                    for (const line of lines) {
                        if (line.trim()) {
                            // Show stderr messages that are not progress related
                            if (!line.match(/^\s*[\d.]+%\s+of/) &&
                                !line.includes('[download]') &&
                                line.includes('ERROR')) {
                                // console.warn("[yt-dlp ERROR]", line);
                                log(chalk.yellow('\n[yt-dlp ERROR]'), '⚠️', line);
                            }
                        }
                    }
                });

                downloadProcess.on("close", (code) => {
                    if (progressBar) {
                        progressBar.stop();
                        progressBar = null;
                    }

                    if (code !== 0) {
                        // console.error("\n❌ Processo yt-dlp terminou com erro (código:", code + ")");
                        log(chalk.red('\n[ERROR]') + ` ❌ Processo yt-dlp terminou com erro (código: ${code})`);
                        return;
                    }

                    // Verificar se o arquivo existe
                    if (!fs.existsSync(outputPath)) {
                        // console.error("\n❌ Arquivo não foi criado no caminho esperado.");
                        log(chalk.red('\n[ERROR]') + ' ❌ O Arquivo não foi criado no caminho esperado.');
                        return;
                    }

                    // console.log(`\n✅ Download concluído com sucesso: ${outputPath}`);
                    log(chalk.green('\n[SUCCESS]') + ` ✅ Download concluído com sucesso: ${outputPath}`);
                });

                // Handle process termination gracefully
                process.on('SIGINT', () => {
                    if (progressBar) {
                        progressBar.stop();
                    }
                    downloadProcess.kill();
                    log(chalk.red('\n[ERROR]') + ' ❌ Download cancelado pelo utilizador.');
                    process.exit(0);
                });
            });

        } catch (error: any) {
            if (progressBar) {
                progressBar.stop();
            }
            log(chalk.red('\n[ERROR]') + ' ❌ Erro inesperado ao processar o comando:', error?.message || error);
        }
    });

program.parse(process.argv);