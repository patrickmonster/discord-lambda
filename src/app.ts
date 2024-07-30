import AutoLoad from '@fastify/autoload';
import helmet from '@fastify/helmet';
import fastify from 'fastify';

import { join } from 'path';

import Multipart from '@fastify/sensible';

//////////////////////////////////////////////////////////////////////
// 환경변수

const server = fastify({
    // logger: env.NODE_ENV != 'prod'
    logger: { transport: { target: '@fastify/one-line-logger' } },
});

server.get('/ping', { schema: { hide: true } }, async (req, res) => 'pong');

// 서버 요청 카운트
server.addHook('onRequest', (request, reply, done) => {
    console.log(`Request: ${request.method} ${request.url}`);
    done();
});

// 플러그인
server.register(helmet, { global: true });
server.register(Multipart);
server.register(AutoLoad, { dir: join(__dirname, 'plugins') });

// 라우터
server.register(AutoLoad, { dir: join(__dirname, 'routes'), ignorePattern: /.*(test|spec).*/ });

export default server;

//////////////////////////////////////////////////////////////////////
// 프로세서 모듈
