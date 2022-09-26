# 保存文件到数据库

将解析好的文件保存进数据库，对象数据库采用minio

## 安装

```sh
yarn add @mmstudio/an000043
```

## 配置文件

.env or .env.local

```conf
MINIO_NAME_SPACE=mmstudio
MINIO_CONFIG = {"endPoint":"127.0.0.1","port":9000,"accessKey":"mmstudio","secretKey":"Mmstudio123","useSSL":false,"region":"cn-north-1","partSize":5242880}
```
