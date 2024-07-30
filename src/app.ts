import AutoLoad from '@fastify/autoload';
import fastify from 'fastify';

import { join } from 'path';

//////////////////////////////////////////////////////////////////////
// 환경변수

const server = fastify({
    logger: { transport: { target: '@fastify/one-line-logger' } },
});

server.get('/ping', { schema: { hide: true } }, async (req, res) => 'pong');

// 플러그인
server.register(AutoLoad, { dir: join(__dirname, 'plugins') });

// 라우터
server.register(AutoLoad, { dir: join(__dirname, 'routes'), ignorePattern: /.*(test|spec).*/ });

export default server;

//////////////////////////////////////////////////////////////////////
// 프로세서 모듈
