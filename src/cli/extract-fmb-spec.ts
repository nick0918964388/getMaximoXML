#!/usr/bin/env node
/**
 * CLI tool to extract functional specification from Oracle Forms FMB XML
 *
 * Usage:
 *   npx ts-node src/cli/extract-fmb-spec.ts <fmb-xml-file> [output-format]
 *
 * Output formats:
 *   - markdown (default): Generate markdown specification document
 *   - json: Generate JSON specification
 *   - console: Print summary to console
 */

import * as fs from 'fs';
import * as path from 'path';
import { FmbSpecExtractor } from '../parsers/fmb-spec-extractor';

function printUsage() {
  console.log(`
FMB Spec Extractor - Extract functional specification from Oracle Forms FMB XML

Usage:
  npx ts-node src/cli/extract-fmb-spec.ts <fmb-xml-file> [output-format] [output-file]

Arguments:
  fmb-xml-file   Path to FMB XML file
  output-format  Output format: markdown, json, or console (default: markdown)
  output-file    Optional output file path (defaults to stdout)

Examples:
  npx ts-node src/cli/extract-fmb-spec.ts spec/xml/ODPCS126_fmb.xml
  npx ts-node src/cli/extract-fmb-spec.ts spec/xml/ODPCS126_fmb.xml json
  npx ts-node src/cli/extract-fmb-spec.ts spec/xml/ODPCS126_fmb.xml markdown output/spec.md
`);
}

function printConsoleSpec(spec: ReturnType<FmbSpecExtractor['parse']>) {
  console.log('='.repeat(70));
  console.log(`表單名稱: ${spec.name}`);
  console.log(`表單標題: ${spec.title}`);
  console.log('='.repeat(70));

  for (const block of spec.blocks) {
    if (block.fields.length === 0) continue;

    console.log(`\n【${block.singleRecord ? '表頭' : '明細'}欄位 - ${block.name}】`);
    console.log('-'.repeat(70));
    console.log(
      `${'欄位名稱'.padEnd(20)} ${'標籤'.padEnd(15)} ${'類型'.padEnd(12)} ${'資料類型'.padEnd(10)} ${'提示'.padEnd(20)}`
    );
    console.log('-'.repeat(70));

    for (const field of block.fields) {
      const name = field.name.slice(0, 18).padEnd(20);
      const label = (field.label || '').slice(0, 13).padEnd(15);
      const itemType = field.itemType.slice(0, 10).padEnd(12);
      const dataType = field.dataType.slice(0, 8).padEnd(10);
      const hint = (field.hint || '').slice(0, 18).padEnd(20);

      console.log(`${name} ${label} ${itemType} ${dataType} ${hint}`);
    }
  }

  if (spec.buttons.length > 0) {
    console.log('\n【按鈕】');
    console.log('-'.repeat(70));
    for (const btn of spec.buttons) {
      console.log(`  - ${btn.name}: ${btn.label}`);
    }
  }

  if (spec.lovs.length > 0) {
    console.log('\n【LOV (下拉選單)】');
    console.log('-'.repeat(70));
    for (const lov of spec.lovs) {
      console.log(
        `  - ${lov.name}: ${lov.title || '(無標題)'} -> ${lov.recordGroupName}`
      );
    }
  }

  console.log('\n');
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printUsage();
    process.exit(0);
  }

  const inputFile = args[0];
  const outputFormat = args[1] || 'markdown';
  const outputFile = args[2];

  // Validate input file
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: File not found: ${inputFile}`);
    process.exit(1);
  }

  // Read and parse FMB XML
  const content = fs.readFileSync(inputFile, 'utf-8');
  const extractor = new FmbSpecExtractor();
  const spec = extractor.parse(content);

  let output: string;

  switch (outputFormat.toLowerCase()) {
    case 'json':
      output = extractor.generateJsonSpec(spec);
      break;
    case 'markdown':
    case 'md':
      output = extractor.generateMarkdownSpec(spec);
      break;
    case 'console':
      printConsoleSpec(spec);
      return;
    default:
      console.error(`Error: Unknown output format: ${outputFormat}`);
      console.error('Valid formats: markdown, json, console');
      process.exit(1);
  }

  // Output
  if (outputFile) {
    const dir = path.dirname(outputFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputFile, output, 'utf-8');
    console.log(`Specification written to: ${outputFile}`);
  } else {
    console.log(output);
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
