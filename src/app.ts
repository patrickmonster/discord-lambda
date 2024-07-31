import { selectUser } from 'controllers/user';
import { APIInteraction, InteractionResponseType, InteractionType } from 'discord-api-types/v10';
import fastify, { FastifyReply } from 'fastify';
import { createReply } from 'utils/discord';

import { verifyKey } from 'utils/interaction';

//////////////////////////////////////////////////////////////////////
// 환경변수

const server = fastify({
    logger: { transport: { target: '@fastify/one-line-logger' } },
});

server.get('/ping', async (req, res) => 'pong');
// 플러그인
// server.register(AutoLoad, { dir: join(__dirname, 'plugins') });

// 라우터
server.post<{
    Body: APIInteraction;
    Params: {
        id: string;
    };
}>(
    '/bot/:id',
    {
        preHandler: [
            (request, reply: FastifyReply, done: Function) =>
                selectUser(request.params?.id)
                    .then(user => {
                        const { body, headers, rawBody } = request;
                        if (
                            verifyKey(
                                rawBody || JSON.stringify(body),
                                `${headers['x-signature-ed25519'] || headers['X-Signature-Ed25519']}`,
                                `${headers['x-signature-timestamp'] || headers['X-Signature-Timestamp']}`,
                                `${user.public_key}`
                            )
                        ) {
                            return done();
                        }
                        throw new Error('User not found');
                    })
                    .catch(err => {
                        reply.status(404).send({ error: 'User not found' });
                    }),
        ],
        schema: {
            // hide: true,
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: '봇 ID' },
                },
            },
        },
    },
    (req, res) => {
        const { body } = req;

        // 상태체크 처리
        if (body.type === InteractionType.Ping) {
            return res.status(200).send({ type: InteractionResponseType.Pong });
        }

        const content = createReply(req, res);

        const { app_permissions, application_id } = content;

        // return done();        // 응답이 유동적인 처리를 해야함.
        //     const interaction = fastify.interaction(req, res);
        //     const msg: any = { ...body, ...body.data };
        //     for (const [key, value] of interaction) {
        //         msg[key as string] = value;
        //     }

        //     // isolated-vm

        //     // (body.type, )

        //     switch (body.type) {
        //         case InteractionType.ApplicationCommand:
        //             // app && app(msg);
        //             break;
        //         case InteractionType.MessageComponent:
        //             // message && message(msg);
        //             break;
        //         case InteractionType.ModalSubmit:
        //             // model && model(msg);
        //             break;
        //         case InteractionType.ApplicationCommandAutocomplete:
        //             // autocomplete && autocomplete(msg);
        //             break;
        //         default:
        //             break;
        //     }
        // }
    }
);

export default server;

//////////////////////////////////////////////////////////////////////
// 프로세서 모듈
