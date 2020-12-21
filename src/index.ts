import { promises as fs } from 'fs';
import anylogger from 'anylogger';
import { Client, ClientOptions } from 'minio';
import config from '@mmstudio/config';
import uuid from '@mmstudio/an000008';
import { IFile as IFileBase } from '@mmstudio/an000041';

const logger = anylogger('@mmstudio/an000043');

const minio = config.minio as ClientOptions;
const client = new Client(minio);
const NAME_SPACE = 'mmstudio';

export interface IFileDoc<M> {
	id: string
	contentType: string
	name: string
	md5: string
	meta: M
}

interface IFile<M = Record<string, unknown>> extends IFileBase {
	id?: string;
	meta: M;
}

export default async function up<M = Record<string, unknown>>(files: IFile<M>[]) {
	if (!(await client.bucketExists(NAME_SPACE))) {
		await client.makeBucket(NAME_SPACE, minio.region || 'cn-north-1');
	}
	return Promise.all(files.map(async (file) => {
		const meta = {
			...file.meta,
			'content-type': file.type,
			originialfilename: encodeURIComponent(file.name),
		};
		const id = file.id || uuid();
		if (file.path) {
			// 原文件，上传的时候有存储到文件系统中
			// 压缩处理后的文件
			const md5 = await client.fPutObject(NAME_SPACE, id, file.path, meta);
			const doc = {
				meta,
				contentType: file.type,
				id,
				md5,
				name: file.name,
			} as IFileDoc<typeof meta>;
			void fs.unlink(file.path);
			return doc;
		}
		logger.error('Could not read file from file system:');
		throw new Error('Could not read file.');
	}));
}
