import {DeleteAllInteractor} from '@mobilejazz/harmony-core';
import {OAuthAccessTokenQuery} from '../../data/datasource/query/oauth-access-token.query';
import {OAuthRefreshTokenQuery} from '../../data/datasource/query/oauth-refresh-token.query';

export class DeleteOAuthTokenInteractor {
    constructor(
        private readonly deleteToken: DeleteAllInteractor,
    ) {}
    async execute(accessToken?: string, refreshToken?: string): Promise<void> {
        try {
            if (accessToken) {
                await this.deleteToken.execute(new OAuthAccessTokenQuery(accessToken));
            }
            if (refreshToken) {
                await this.deleteToken.execute(new OAuthRefreshTokenQuery(refreshToken));
            }
        } catch (err) {
            console.log('delete error: ', err);
        }
        return Promise.resolve();
    }
}
