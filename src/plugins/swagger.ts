'use strict';
import { FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

import { fastifySwagger } from '@fastify/swagger';
import swagger_ui from '@fastify/swagger-ui';

/**
 * This plugins adds some utilities to handle http errors
 *
 * @see https://github.com/fastify/fastify-sensible
 */
export default fp(async function (fastify, opts) {
    fastify.register(fastifySwagger, {
        openapi: {
            openapi: '3.0.0',
            info: {
                title: '처음 API',
                description: `
# 처음 API
        `,
                version: '1.0.0',
            },
            tags: [
                /// 버전 관련
            ],
            components: {
                securitySchemes: {},
            },
            paths: {},
        },
    });

    fastify.register(swagger_ui, {
        routePrefix: '/doc',
        // logo: {
        //     type: 'image/png',
        //     content: Buffer.from('', 'base64'),
        // },
        uiConfig: {
            docExpansion: 'list',
            // docExpansion: 'full',
            deepLinking: false,
        },
        transformSpecification: (swaggerObject, request, reply) => swaggerObject,
        transformSpecificationClone: true,
    });

    fastify.addSchema({
        $id: 'sqlResult',
        type: 'object',
        description: '쿼리 결과 (업데이트 / 인서트)',
        nullable: true,
        properties: {
            info: { type: 'string' },
            affectedRows: { type: 'number' },
            fieldCount: { type: 'number' },
            insertId: { type: 'number' },
        },
    });

    fastify.addSchema({
        $id: 'authId',
        type: 'string',
        description: '디스코드 ID',
        minLength: 17,
        maxLength: 20,
    });

    fastify.addSchema({
        $id: 'paging',
        type: 'object',
        description: '페이징',
        properties: {
            page: { type: 'number', description: '페이지 번호', default: 0, minimum: 0 },
            limit: { type: 'number', description: '페이지당 개수', default: 10, minimum: 1, maximum: 100 },
        },
    });

    fastify.decorateReply('paging', (req: FastifyRequest) => (<{ page: number }>req.query).page || 0);
});
