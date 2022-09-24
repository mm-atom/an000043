import { promises as fs } from 'fs';
import { extname } from 'path';
import anylogger from 'anylogger';
import { Client, ClientOptions } from 'minio';
import uuid from '@mmstudio/an000008';
import { IFile as IFileBase } from '@mmstudio/an000041';
import an61 from '@mmstudio/an000061';

const logger = anylogger('@mmstudio/an000043');

let gClient: Client;

export interface IFileDoc<M, N> {
	id: string;
	contentType: string;
	name: string;
	md5: string;
	meta: M;
	fields: N;
}

interface IFile<M = Record<string, unknown>, N = Record<string, string[]>> extends IFileBase<N> {
	id?: string;
	meta: M;
}

export default async function up<M = Record<string, unknown>, N = Record<string, string[]>>(files: IFile<M, N>[], secret: boolean) {
	const client = getClient();
	if (!(await client.bucketExists(getNameSpace()))) {
		await client.makeBucket(getNameSpace(), getConfig().region || 'cn-north-1');
	}
	return Promise.all(files.map(async (file) => {
		const meta = {
			...file.meta,
			fields: file.fields,
			'content-type': file.type,
			originialfilename: encodeURIComponent(file.name),
		};
		if (file.id) {
			try {
				await client.removeObject(getNameSpace(), file.id);
			} catch {
				// file may not exist. ignore
			}
		}
		if (file.path) {
			const id = (() => {
				if (file.id) {
					return file.id;
				}
				if (file.fields) {
					const id = (file.fields as unknown as {
						id: string;
					}).id;
					if (id && typeof id === 'string') {
						return id;
					}
				}
				const ext = extname(file.name);
				if (ext) {
					return `${uuid()}${ext}`;
				}
				const id = uuid();
				// 文件名中无后缀名
				switch (file.type) {
					case 'text/plain':
						return `${id}.txt`;
					case 'text/html':
						return `${id}.html`;
					case 'image/jpeg':
						return `${id}.jpeg`;
					case 'image/png':
						return `${id}.png`;
					case 'audio/wave':
					case 'audio/wav':
					case 'audio/x-wav':
					case 'audio/x-pn-wav':
						return `${id}.wav`;
					case 'audio/mpeg':
						return `${id}.mp3`;
					case 'audio/ogg':
						return `${id}.ogg`;
					case 'video/mp4':
						return `${id}.mp4`;
					case 'video/ogg':
					case 'application/ogg':
						return `${id}.ogg`;
					case 'application/json':
						return `${id}.json`;
					case 'application/javascript':
						return `${id}.js`;
					case 'application/ecmascript':
						return `${id}.js`;
					case 'image/gif':
						return `${id}.gif`;
					case 'image/svg+xml':
						return `${id}.svg`;
					case 'application/x-7z-compressed':
						return `${id}.7z`;
					case 'application/x-gzip':
						return `${id}.gz`;
					case 'application/zip':
						return `${id}.zip`;
					case 'application/x-rar':
						return `${id}.rar`;
					case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
						return `${id}.odt`;
					case 'application/msword':
						return `${id}.doc`;
					case 'application/wps-office.docx':
						return `${id}.docx`;
					case 'application/vnd.ms-excel':
						return `${id}.xls`;
					case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
						return `${id}.ods`;
					case 'application/wps-office.xlsx':
						return `${id}.xlsx`;
					case 'application/vnd.ms-powerpoint':
						return `${id}.ppt`;
					case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
						return `${id}.odp`;
					case 'application/wps-office.pptx':
						return `${id}.pptx`;
					case 'application/pdf':
						return `${id}.pdf`;
					case 'audio/*':
					case 'application/*':
					case 'application/octet-stream':
					default:
						return id;
				}
			})();
			if (secret) {
				const buf = await fs.readFile(file.path);
				await fs.writeFile(file.path, an61.encrypt(buf));
			}
			const info = await client.fPutObject(getNameSpace(), id, file.path, meta);
			const md5 = info.etag;
			const doc = {
				meta,
				contentType: file.type,
				id,
				md5,
				fields: file.fields,
				name: file.name,
			} as IFileDoc<typeof meta, N>;
			void fs.unlink(file.path);
			return doc;
		}
		logger.error('Could not read file from file system:');
		throw new Error('Could not read file.');
	}));
}

function getClient() {
	if (!gClient) {
		gClient = new Client(getConfig());
	}
	return gClient;
}

function getNameSpace() {
	return process.env.MINIO_NAME_SPACE || 'mmstudio';
}

let gConfig: ClientOptions;
function getConfig() {
	if (!gConfig) {
		gConfig = JSON.parse(process.env.MINIO_CONFIG!) as ClientOptions;
	}
	return gConfig;
}
