import prettier from 'eslint-config-prettier';
import js from '@eslint/js';
import { includeIgnoreFile } from '@eslint/compat';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import ts from 'typescript-eslint';

const __dirname = dirname(fileURLToPath(import.meta.url));
const gitignorePath = `${__dirname}/.gitignore`;

export default ts.config(
    includeIgnoreFile(gitignorePath),
    js.configs.recommended,
    ...ts.configs.recommended,
    prettier,
    {
        rules: {
            'no-console': 'error'
        }
    }
);
