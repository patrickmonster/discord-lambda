import { FastifyReply, FastifyRequest } from 'fastify';
import { InteractionResponseType } from 'utils/interaction';

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

/// TYPE def
import {
    APIApplicationCommandAutocompleteInteraction,
    APIApplicationCommandInteraction,
    APICommandAutocompleteInteractionResponseCallbackData,
    APIInteraction,
    APIMessage,
    APIMessageComponentInteraction,
    APIModalInteractionResponseCallbackData,
    APIModalSubmitInteraction,
    APIWebhook,
    InteractionType,
} from 'discord-api-types/v10';

import { RESTPostAPIChannelMessageJSONBody } from 'discord-api-types/rest/v10';

export type Interaction =
    | APIApplicationCommandInteraction
    | APIMessageComponentInteraction
    | APIApplicationCommandAutocompleteInteraction
    | APIModalSubmitInteraction;

export {
    APIApplicationCommandAutocompleteInteraction,
    APIApplicationCommandInteraction,
    APIApplicationCommandInteractionData,
    APIChatInputApplicationCommandInteractionData,
    APIMessageComponentInteraction,
    APIMessageComponentInteractionData,
    APIModalSubmission,
    APIModalSubmitInteraction,
    APIWebhook,
    ApplicationCommandType,
    ComponentType,
} from 'discord-api-types/v10';

// 비공개 응답
type ephemeral = { ephemeral?: boolean };

export type RESTPostAPIChannelMessage = RESTPostAPIChannelMessageJSONBody & ephemeral;
export type RESTPostAPIChannelMessageParams = RESTPostAPIChannelMessage | string;

interface CustomInstance extends AxiosInstance {
    get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
    delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
    post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
}
const discordInteraction: CustomInstance = axios.create({
    baseURL: 'https://discord.com/api',
    headers: { 'Content-Type': 'application/json' },
});

discordInteraction.interceptors.response.use(
    response => response.data,
    error => Promise.reject(error.response.data)
);

export const createReply = (
    req: FastifyRequest<{
        Body: APIInteraction;
    }>,
    res: FastifyReply,
    id: string = '@original'
) => {
    const {
        body: { token, application_id, type },
    } = req;

    // 응답 처리 여부
    let isReply = id !== '@original'; // id가 @original이 아닌 경우 응답 처리됨 (후행 메세지)

    /**
     * 메세지를 string으로 받으면 content로 설정
     * object로 받으면 그대로 설정
     *
     * ephemeral = 비공개 메세지
     * @param message
     * @returns
     */
    const appendEmpheral = (message: RESTPostAPIChannelMessageParams): RESTPostAPIChannelMessageJSONBody =>
        typeof message === 'string'
            ? { content: message }
            : Object.assign(message, message.ephemeral ? { flags: 64 } : {});

    const replyRes = async (type: InteractionResponseType, data: any) => {
        if (isReply) return console.info('이미 응답 처리된 요청입니다.');
        isReply = true;
        return await res.code(200).send({ type, data });
    };

    /**
     *
     * @returns
     */
    const get = () => discordInteraction.get<APIMessage>(`/webhooks/${application_id}/${token}/messages/${id}`);
    const remove = () => discordInteraction.delete(`/webhooks/${application_id}/${token}/messages/${id}`);

    /**
     * 자동완성 응답
     * @param message
     * @returns
     */
    const auto = (message: APICommandAutocompleteInteractionResponseCallbackData) =>
        res.status(200).send({ type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT, data: message });

    /**
     * 응답
     * @param message
     */
    const reply = (message: RESTPostAPIChannelMessage) =>
        isReply
            ? discordInteraction.patch(`/webhooks/${application_id}/${token}/messages/${id}`, message).catch(e => {
                  console.log(
                      '메세지 수정 실패',
                      `/webhooks/${application_id}/${token}/messages/${id}`,
                      e.response.data
                  );
              })
            : replyRes(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, appendEmpheral(message));

    /**
     * 선처리 응답
     * @param message
     */
    const differ = async (message?: ephemeral) =>
        await replyRes(InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, {
            flags: message?.ephemeral ? 64 : 0,
        });

    /**
     * 모달 응답
     * @param message
     * @returns
     */
    const model = async (message: APIModalInteractionResponseCallbackData) =>
        type !== InteractionType.ModalSubmit
            ? await res.status(200).send({
                  type: InteractionResponseType.MODAL,
                  data: message,
              })
            : Promise.reject('모달 응답은 모달 이벤트에서 사용할 수 없습니다.');

    /**
     * 선처리 메세지 수정
     * @param message
     * @returns
     */
    const edit = async (message: RESTPostAPIChannelMessage) =>
        type === InteractionType.MessageComponent
            ? await res.status(200).send({
                  type: InteractionResponseType.UPDATE_MESSAGE,
                  data: message,
              })
            : Promise.reject('선처리 메세지 수정은 컴포넌트 이벤트에서만 사용할 수 있습니다.');
    // 선처리 메세지 수정 ( 인터렉션 전의 이벤트)
    /**
     * 후행 선처리 메세지 수정
     * @param message
     */
    const differEdit = async (message: RESTPostAPIChannelMessage) =>
        type === InteractionType.MessageComponent
            ? await res.status(200).send({
                  type: InteractionResponseType.DEFERRED_UPDATE_MESSAGE,
                  data: message,
              })
            : Promise.reject('선처리 메세지 수정은 컴포넌트 이벤트에서만 사용할 수 있습니다.');

    /**
     * 후행 처리 응답 메세지
     * @param message
     * @returns
     */
    const follow = (message: RESTPostAPIChannelMessage) =>
        discordInteraction
            .post<APIWebhook>(`/webhooks/${application_id}/${token}`, appendEmpheral(message))
            .then(({ id }) => {
                return createReply(req, res, id);
            });

    return Object.assign(req.body, { get, remove, auto, differ, differEdit, edit, follow, model, reply });
};
