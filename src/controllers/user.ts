import { query } from 'utils/database';

/**
 * 쿼리 에러를 조회합니다.
 *  API 단에서 발생한 에러를 조회합니다.
 * @param query
 * @returns
 */
export const selectUser = async (botId: string) =>
    await query<{
        bot_id: string;
        auth_id: string;
        name: string;
        public_key: string;
        create_at: string;
        update_at: string;
        use_yn: string;
    }>(
        `
SELECT bot_id
    , auth_id
    , name
    , public_key
    , create_at
    , update_at
    , use_yn
FROM acunt_bot
WHERE bot_id = ?
    `,
        botId
    ).then(rows => rows[0]);
