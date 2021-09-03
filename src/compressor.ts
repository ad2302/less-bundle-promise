import fs from "fs";
import path from "path";
import * as globals from "./globals";
import { buildContents } from "./buildcontents";
import { generateOutput } from "./generateoutput";
import mkdirp from "mkdirp";
import { promisify } from "util";
import { pathExists } from "path-exists";

const openAsync = promisify(fs.open);
const writeAsync = promisify(fs.write);
const closeAsync = promisify(fs.close);
const readFileAsync = promisify(fs.readFile);

async function writeToFile(path: string, data: Array<string>) {
  const fd = await openAsync(path, "w"),
    buffer = Buffer.from(data.join("\n"), "utf8");
  await writeAsync(fd, buffer, 0, buffer.length, 0);
  await closeAsync(fd);
}

/**
 * Uses the config to go through all of the framework *.less files in the
 * proper order and compresses them into a single file for packaging.
 *
 * @param config The configuration for compressing the files.
 * when the task is complete.
 */
export async function compress(config: globals.IConfig) {
  globals.initialize(config);

  const src = path.resolve(globals.config.src),
    writeFile = config && config.writeFile,
    output = globals.output,
    dest = globals.config.dest,
    version = globals.config.version,
    license = globals.config.license;

  // Goes through each file in the dest files and makes sure they have a
  // .less extension.
  if (writeFile) {
    dest?.forEach((outFile, index) => {
      const end = outFile.lastIndexOf(".");
      dest[index] = outFile.substring(0, end > -1 ? end : undefined) + ".less";
    });
  }

  // Reads the src file, builds the contents for each
  // file in the proper order, and generates the output file.
  const data = await readFileAsync(src, "utf8");

  const splitLines = data.split(/\r\n|\n/);
  splitLines[0] = splitLines[0].trim();
  buildContents(splitLines, src);

  // generate the output
  generateOutput();

  // If a license file is specified, we want to prepend it to the output.
  if (license) {
    const licenseFile = path.resolve(license),
      licenseData = fs.readFileSync(licenseFile, "utf8"),
      lines = licenseData.split(/\r\n|\n/),
      regex = /(.*)v\d+\.\d+\.\d+(.*)/;

    // If a version is specified, we want to go through and find where
    // the version is specified in the license, then replace it with the
    // passed-in version.
    if (version) {
      lines.some((line, index) => {
        if (regex.test(line)) {
          lines[index] = line.replace(regex, "$1v" + version + "$2");
          return true;
        }
        return false;
      });
    }

    // Add the lines as a comment block
    lines.forEach((line, index) => {
      lines[index] = " * " + line;
    });

    lines.unshift("/**");
    lines.push(" */");

    output.unshift(lines.join("\n"));
  }

  // Make sure the file ends in a new line.
  if (!!output[output.length - 1].trim()) {
    output.push("");
  }

  // Go through each destination file and make sure we can
  // write a file to the location, making new directories
  // if necessary. Then write the output to each destination.
  if (writeFile && dest) {
    await Promise.all(
      dest.map(async (destFile) => {
        const p = path.normalize(destFile);
        const d = path.dirname(p);
        const isExists = await pathExists(d);
        if (!isExists) {
          await mkdirp(d);
        }
        await writeToFile(p, output);
      })
    );
  }
  return output.join("\n");
}

