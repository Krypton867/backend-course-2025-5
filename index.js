import { Command } from 'commander';

const program = new Command();

program.option('-i, --input <path>');

program.parse(process.argv);
const options = program.opts();

console.log("Input file:", options.input);