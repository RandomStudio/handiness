const OFF = 0;
const WARN = 1;
const ERROR = 2;

module.exports = {
	root: true,
	env: {
		node: true,
		es6: true,
	},
	// parser: '@babel/eslint-parser',
	parserOptions: {
		// to enable features such as async/await
		ecmaVersion: 8,
		sourceType: 'module',
	},
	// We don't want to lint generated files nor node_modules,
	// but we want to lint .prettierrc.js (ignored by default by eslint)
	ignorePatterns: ['node_modules/*', '.next/*', '.out/*', '!.prettierrc.js'],
	extends: [
		'eslint:recommended',
		// 'airbnb',
		'plugin:prettier/recommended', // Prettier recommended rules
	],
	plugins: [
		// 'babel',
		"svelte3",
		'prettier',
	],
	overrides: [
		{
			files: ['*.svelte'],
			processor: 'svelte3/svelte3'
		}
	],
	rules: {
		'arrow-parens': OFF,
		'no-unused-vars': WARN,
		'comma-dangle': [ERROR, 'only-multiline'],
		'max-len': [ERROR, { code: 120, tabWidth: 2 }],
		'no-plusplus': OFF,
		// 'no-tabs': [WARN, { allowIndentationTabs: true }],
		'prettier/prettier': [ERROR, {}, { usePrettierrc: true }],
		// Includes .prettierrc.js rules
		indent: [ERROR, 'tab'],
	},
};