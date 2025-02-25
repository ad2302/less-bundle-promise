﻿export class Writer {

    /**
     * Creates a new Writer with the given lines.
     * 
     * @param lines The lines to set for the Writer.
     */
    constructor(private __lines:string[]) {
    }

    /**
     * Writes the lines for this writer into the output array.
     * 
     * @param output The output lines to which the Writer's lines should be appended.
     * @param previousLine The previous line that was added to output.
     */
    write(output: Array<string>, previousLine: string) {
        // If this writer has a module associated with it, we want to first add the 
        // lines for the module before adding the lines for this writer.
        var trim: string;

        // Add every line to the output.
        this.__lines.forEach((line) => {
            trim = line.trim();

            if (!previousLine && !trim) {
                return;
            }
            output.push(line);
            previousLine = trim;
        });

        return previousLine;
    }
}
