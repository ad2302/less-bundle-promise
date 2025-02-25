﻿import * as globals from "./globals";

const output = globals.output;

function removeEmptyStringsFromEnd(output: Array<string>) {
  while (!output[output.length - 1]) {
    output.pop();
  }
}

/**
 * Iterates through writers and invokes their write
 * function, building the output array.
 */
export function generateOutput() {
  const writers = globals.writers;
  let previousLine = "";

  writers.forEach((writer) => {
    previousLine = writer.write(output, previousLine);
  });

  removeEmptyStringsFromEnd(output);
}
