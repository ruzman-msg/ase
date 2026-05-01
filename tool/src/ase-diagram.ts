/*
**  Agentic Software Engineering (ASE)
**  Copyright (c) 2025-2026 Dr. Ralf S. Engelschall <rse@engelschall.com>, Matthias Brusdeylins <matthias@brusdeylins.info>
**  Licensed under GPL 3.0 <https://spdx.org/licenses/GPL-3.0-only>
*/

import fs                     from "node:fs"
import tty                    from "node:tty"

import { Command }            from "commander"
import { renderMermaidASCII } from "beautiful-mermaid"

import type Log               from "./ase-log.js"

interface DiagramOpts {
    ascii?:     boolean
    colorMode?: string
    input?:     string
    padX?:      string
    padY?:      string
    padBox?:    string
}

/*  detect terminal color capability via /dev/tty  */
/*  (stdout is piped to capture diagram output, so query the controlling terminal directly)  */
const detectColorMode = (): "none" | "ansi16" | "ansi256" => {
    let fd = -1
    try {
        fd = fs.openSync("/dev/tty", "r+")
        const stream = new tty.WriteStream(fd)
        const depth  = stream.getColorDepth()
        stream.destroy()
        if (depth >= 8) return "ansi256"
        if (depth >= 4) return "ansi16"
        return "none"
    }
    catch {
        if (fd >= 0) {
            try { fs.closeSync(fd) }
            catch { /*  ignore  */ }
        }
        return "none"
    }
}

/*  read stdin into a single string  */
const readStdin = async (): Promise<string> => {
    const chunks: Buffer[] = []
    for await (const chunk of process.stdin)
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk)
    return Buffer.concat(chunks).toString("utf8")
}

/*  command-line handling  */
export default class DiagramCommand {
    constructor (private log: Log) {}

    /*  register commands  */
    register (program: Command): void {
        program
            .command("diagram")
            .description("Render Mermaid source (stdin or --input) to aligned Unicode/ASCII diagram")
            .option("-a, --ascii",             "emit plain ASCII (+-|) instead of Unicode box-drawing", false)
            .option("-c, --color-mode <mode>", "force particular color mode to use (\"none\", \"ansi16\", or \"ansi256\")")
            .option("-i, --input <file>",      "read Mermaid source from file instead of stdin")
            .option("-x, --pad-x <n>",         "horizontal spacing between nodes", "3")
            .option("-y, --pad-y <n>",         "vertical spacing between nodes", "3")
            .option("-b, --pad-box <n>",       "inner node box spacing", "1")
            .action(async (opts: DiagramOpts) => {
                /*  load Mermaid source  */
                let src: string
                if (opts.input !== undefined)
                    src = fs.readFileSync(opts.input, "utf8")
                else
                    src = await readStdin()
                if (src.trim() === "") {
                    this.log.write("error", "diagram: empty Mermaid source")
                    process.exit(1)
                }

                /*  parse spacing options  */
                const paddingX = Number.parseInt(opts.padX ?? "3", 10)
                if (!Number.isFinite(paddingX)) {
                    this.log.write("error", "diagram: --pad-x must be integer")
                    process.exit(1)
                }
                const paddingY = Number.parseInt(opts.padY ?? "3", 10)
                if (!Number.isFinite(paddingY)) {
                    this.log.write("error", "diagram: --pad-y must be integer")
                    process.exit(1)
                }
                const boxBorderPadding = Number.parseInt(opts.padBox ?? "1", 10)
                if (!Number.isFinite(boxBorderPadding)) {
                    this.log.write("error", "diagram: --pad-box must be integer")
                    process.exit(1)
                }

                /*  determine color mode (explicit option overrides auto-detection)  */
                let colorMode: "none" | "ansi16" | "ansi256"
                if (opts.colorMode === "none" || opts.colorMode === "ansi16" || opts.colorMode === "ansi256")
                    colorMode = opts.colorMode
                else if (opts.colorMode === undefined)
                    colorMode = detectColorMode()
                else {
                    this.log.write("error", "diagram: --color-mode must be \"none\", \"ansi16\", or \"ansi256\"")
                    process.exit(1)
                }

                /*  render to ASCII  */
                try {
                    const out = renderMermaidASCII(src, {
                        useAscii: opts.ascii ?? false,
                        paddingX,
                        paddingY,
                        boxBorderPadding,
                        colorMode,
                        theme: colorMode !== "none" ? {
                            fg:       "#000000",
                            border:   "#a0a0a0",
                            junction: "#a0a0a0",
                            arrow:    "#404040",
                            line:     "#707070",
                            corner:   "#707070"
                        } : {
                            fg:       "#000000",
                            border:   "#000000",
                            junction: "#000000",
                            arrow:    "#000000",
                            line:     "#000000",
                            corner:   "#000000"
                        }
                    })
                    process.stdout.write(out)
                    if (!out.endsWith("\n"))
                        process.stdout.write("\n")
                }
                catch (err: unknown) {
                    const message = err instanceof Error ? err.message : String(err)
                    this.log.write("error", `diagram: render failed: ${message}`)
                    process.exit(1)
                }
            })
    }
}
