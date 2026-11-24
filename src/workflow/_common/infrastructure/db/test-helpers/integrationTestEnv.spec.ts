import { resolveIntegrationDbEnv, withDatabase } from './integrationTestEnv';

const DEV = {
    DB_NAME: 'deputydex',
    DB_URL: 'postgresql://user_etl_writer:pwd@localhost:5432/deputydex?schema=public',
};

describe('resolveIntegrationDbEnv', () => {
    it('redirige DB_NAME et DB_URL vers DB_NAME_TEST', () => {
        expect(resolveIntegrationDbEnv({ ...DEV, DB_NAME_TEST: 'deputydex_it' })).toEqual({
            DB_NAME: 'deputydex_it',
            DB_URL: 'postgresql://user_etl_writer:pwd@localhost:5432/deputydex_it?schema=public',
        });
    });

    it('refuse de tourner sans base de test hors CI', () => {
        expect(() => resolveIntegrationDbEnv(DEV)).toThrow('DB_NAME_TEST');
    });

    it('refuse une base de test identique à la base de développement', () => {
        expect(() => resolveIntegrationDbEnv({ ...DEV, DB_NAME_TEST: 'deputydex' })).toThrow('doit différer');
    });

    it('en CI sans DB_NAME_TEST, garde la base jetable du service Postgres', () => {
        expect(resolveIntegrationDbEnv({ ...DEV, CI: 'true' })).toEqual({});
    });

    it('sans DB_URL, ne redirige que DB_NAME', () => {
        expect(resolveIntegrationDbEnv({ DB_NAME: 'deputydex', DB_NAME_TEST: 'deputydex_it' })).toEqual({ DB_NAME: 'deputydex_it' });
    });
});

describe('withDatabase', () => {
    it('remplace le nom de base et conserve la query string', () => {
        expect(withDatabase('postgresql://u:p@h:5432/a?schema=public', 'b')).toBe('postgresql://u:p@h:5432/b?schema=public');
    });

    it('fonctionne sans query string', () => {
        expect(withDatabase('postgresql://u:p@h:5432/a', 'b')).toBe('postgresql://u:p@h:5432/b');
    });
});
