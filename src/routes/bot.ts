import { selectUser } from 'controllers/user';
import { APIInteraction, InteractionType } from 'discord-api-types/v10';
import { FastifyInstance, FastifyReply } from 'fastify';
import { InteractionResponseType } from 'utils/interaction';

import axios from 'axios';
import ivm from 'isolated-vm';

enum RequestMtthod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE',
    PATCH = 'PATCH',
    HEAD = 'HEAD',
    OPTIONS = 'OPTIONS',
}

export default async (fastify: FastifyInstance, opts: any) => {
    const isolate = new ivm.Isolate({ memoryLimit: 10 });
    fastify.post<{
        Body: APIInteraction;
        Params: {
            id: string;
        };
    }>(
        '/bot/:id',
        {
            preHandler: [
                (request, reply: FastifyReply, done: Function) => {
                    selectUser(request.params?.id)
                        .then(user => {
                            if (user) return fastify.verifyDiscordByKey(request, reply, done, user.public_key);
                            throw new Error('User not found');
                        })
                        .catch(err => {
                            reply.status(404).send({ error: 'User not found' });
                        });
                },
            ],
            schema: {
                // hide: true,
                description: '봇 인터렉션 이벤트 수신부 - 연결 및 사용 X',
                summary: '인터렉션 이벤트',
                tags: ['Util'],
                deprecated: false,
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: '봇 ID' },
                    },
                },
            },
        },
        (req, res) => {
            const {
                params: { id },
            } = req;
            const { body } = req;

            // 상태체크 처리
            if (body.type === InteractionType.Ping) {
                console.log('ping');
                return res.status(200).send({ type: InteractionResponseType.PONG });
            }

            const isolate = new ivm.Isolate({ memoryLimit: 100 });
            isolate.createContext({ inspector: true }).then(async context => {
                const jail = context.global;
                await jail.set('global', jail.derefInto());
                await jail.set('_ivm', ivm);

                await jail.set(
                    'discordAPI',
                    new ivm.Reference(async (method: RequestMtthod, opts: any, callback: ivm.Reference<any>) => {
                        axios('', {
                            method: method,
                            ...opts,
                        })
                            .then(res => {
                                // function (err: any, response: any) {
                                //     if (err) {
                                //         console.log('error in request put');
                                //         callback.applySync(undefined, [err]);
                                //     } else {
                                //         console.log('success!');
                                //         callback.applySync(undefined, [null, 'success']);
                                //     }
                                // }

                                console.log('success!');
                                callback.applySync(undefined, [null, 'success']);
                            })
                            .catch(err => {
                                console.log('error in request put');
                                callback.applySync(undefined, [err]);
                            });
                    })
                );
            });

            // 응답이 유동적인 처리를 해야함.
            const interaction = fastify.interaction(req, res);
            const msg: any = { ...body, ...body.data };
            for (const [key, value] of interaction) {
                msg[key as string] = value;
            }

            // isolated-vm

            // (body.type, )

            switch (body.type) {
                case InteractionType.ApplicationCommand:
                    // app && app(msg);
                    break;
                case InteractionType.MessageComponent:
                    // message && message(msg);
                    break;
                case InteractionType.ModalSubmit:
                    // model && model(msg);
                    break;
                case InteractionType.ApplicationCommandAutocomplete:
                    // autocomplete && autocomplete(msg);
                    break;
                default:
                    break;
            }
        }
    );
};
