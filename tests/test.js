const test = require('ava');
const { loadEnvConfig } = require('@next/env');
const fs = require('fs/promises');

const { default: a } = require('../dist/index');

test.before(async () => {
	loadEnvConfig('./', true);
});

const originFile = './tests/test.jpg';

test('save to db', async (t) => {
	const path = './tests/test1.jpg';
	await fs.cp(originFile, path);
	const file = {
		fields: {},
		name: 'test.jpg',
		path,
		type: 'image/jpeg'
	};
	await a([file], false);
	t.pass();
});

test('encrypt', async (t) => {
	const path = './tests/test2.jpg';
	await fs.cp(originFile, path);
	const file = {
		fields: {},
		name: 'test.jpg',
		path,
		type: 'image/jpeg'
	};
	await a([file], true);
	t.pass();
});
