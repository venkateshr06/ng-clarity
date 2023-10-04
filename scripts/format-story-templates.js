/*
 * Copyright (c) 2016-2023 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

const fs = require('fs');
const glob = require('glob');
const prettier = require('prettier');
const ts = require('typescript');

const prettierConfig = require('../.prettierrc.js');

const [, , ...args] = process.argv;
const fix = args.includes('--fix');
const filePaths = args.filter(arg => arg !== '--fix');

let exitCode = 0;

const storyTsFilePaths = filePaths.length
  ? filePaths.filter(filePath => filePath.endsWith('.stories.ts'))
  : glob.sync('.storybook/**/*.stories.ts');

for (const storyTsFilePath of storyTsFilePaths) {
  const storyTsCode = fs.readFileSync(storyTsFilePath).toString();
  const formattedStoryTsCode = formatStoryTsCode(storyTsCode);

  if (formattedStoryTsCode !== storyTsCode) {
    if (fix) {
      fs.writeFileSync(storyTsFilePath, formattedStoryTsCode);
    } else {
      console.error(storyTsFilePath);
      exitCode = 1;
    }
  }
}

process.exit(exitCode);

function formatStoryTsCode(storyTsCode) {
  const storyTemplates = findStoryTemplates(storyTsCode);

  let formattedStoryTsCode = storyTsCode;

  for (const { storyTemplate, indentLevel } of storyTemplates) {
    const indent = ' '.repeat(indentLevel + 2);

    const formattedStoryTemplate = formatStoryTemplate(storyTemplate, indentLevel);

    const indentedStoryTemplate = formattedStoryTemplate
      .trim()
      .split('\n')
      .map(line => (line ? `${indent}${line}` : ''))
      .join('\n');

    const replacementStoryTemplate = `\n${indentedStoryTemplate}\n${' '.repeat(indentLevel)}`;

    if (formattedStoryTemplate) {
      formattedStoryTsCode = formattedStoryTsCode.replace(storyTemplate, replacementStoryTemplate);
    } else {
      throw new Error(`Unable to format: ${storyTemplate}`);
    }
  }
  return formattedStoryTsCode;
}

function findStoryTemplates(storyTsCode) {
  const storyTemplates = [];
  const sourceFile = ts.createSourceFile('story.ts', storyTsCode, ts.ScriptKind.TS, /* setParentNodes */ true);

  sourceFile.forEachChild(function visit(node) {
    if (
      ts.isPropertyAssignment(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'template' &&
      ts.isTemplateLiteral(node.initializer) &&
      node.initializer.text
    ) {
      storyTemplates.push({
        storyTemplate: node.initializer.text,
        indentLevel: node.getLeadingTriviaWidth() - 1, // subtract new line
      });
    }

    node.forEachChild(visit);
  });

  return storyTemplates;
}

function formatStoryTemplate(storyTemplate, indentLevel) {
  return prettier.format(storyTemplate, {
    ...prettierConfig,
    printWidth: prettierConfig.printWidth - indentLevel,
    parser: 'angular',
    htmlWhitespaceSensitivity: 'ignore',
  });
}
