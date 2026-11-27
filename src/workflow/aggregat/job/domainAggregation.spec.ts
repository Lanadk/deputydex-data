jest.mock('../../_common/infrastructure/db/pool', () => ({ writerPool: {} }));

import * as fs from 'fs';
import * as path from 'path';
import { aggregationScriptsDir, aggregationSteps } from './domainAggregation';
import { VIEWS as REUNIONS_VIEWS } from './reunions/aggregation-oneshot';
import { VIEWS as DEBATS_VIEWS } from './debats/aggregation-oneshot';
import { VIEWS as SCRUTINS_VIEWS } from './scrutins/aggregation-oneshot';
import { VIEWS as PRESENCE_VIEWS } from './presence/aggregation-oneshot';

describe('aggregationSteps', () => {
    it('create : une étape createView par vue, avec le .sql du domaine, dans l\'ordre donné', () => {
        expect(aggregationSteps('create', 'presence', ['a', 'b'])).toEqual([
            { kind: 'createView', label: '[CREATE] a', viewName: 'a', path: path.join(aggregationScriptsDir('presence'), 'a.sql') },
            { kind: 'createView', label: '[CREATE] b', viewName: 'b', path: path.join(aggregationScriptsDir('presence'), 'b.sql') },
        ]);
    });

    it('refresh : une étape refreshView par vue, dans l\'ordre donné', () => {
        expect(aggregationSteps('refresh', 'presence', ['a', 'b'])).toEqual([
            { kind: 'refreshView', label: '[REFRESH] a', viewName: 'a' },
            { kind: 'refreshView', label: '[REFRESH] b', viewName: 'b' },
        ]);
    });
});

describe('domaines de la présence', () => {
    it.each([
        ['reunions', REUNIONS_VIEWS],
        ['debats', DEBATS_VIEWS],
        ['scrutins', SCRUTINS_VIEWS],
        ['presence', PRESENCE_VIEWS],
    ])('chaque vue du domaine %s a son fichier .sql', (domain, views) => {
        for (const view of views) {
            expect(fs.existsSync(path.join(aggregationScriptsDir(domain), `${view}.sql`))).toBe(true);
        }
    });

    it('la vue journalière est créée avant les vues qui l\'agrègent', () => {
        expect(PRESENCE_VIEWS[0]).toBe('mv_deputes_presence_jour');
    });
});
