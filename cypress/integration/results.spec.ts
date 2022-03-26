import { IADSApiSearchParams } from '@api/lib/search/types';
// import { cy, describe, expect, it } from 'local-cypress';

const search = (params: Partial<IADSApiSearchParams>) => {
  cy.visit('/search', {
    qs: params,
  });
};

const updateAndSubmitForm = (value: string) => {
  cy.get('@input', { timeout: 10000 }).should('be.enabled').type(value);
  cy.get('form').submit();
  cy.get('@input', { timeout: 10000 }).should('be.enabled');
};

const assertQueryParam = (checks: Record<string, string>) => {
  cy.location().then((location) => {
    const params = new URLSearchParams(location.search);
    Object.keys(checks).forEach((key) => expect(checks[key]).eq(params.get(key), `checking query param (${key})`));
  });
};

describe('Result Page', () => {
  describe('URL synchronization', () => {
    it('searchbar shows correct search term', () => {
      search({ q: 'a' });
      cy.get('form').find('[type="text"]').first().should('have.value', 'a');
    });

    it('submission updates url correctly', () => {
      search({ q: 'a' });
      cy.get('form').find('[type="text"]', { timeout: 10000 }).first().as('input').should('be.enabled');
      cy.get('@input').should('have.value', 'a');

      updateAndSubmitForm(' b');
      assertQueryParam({ q: 'a b' });
      cy.get('@input').should('have.value', 'a b');

      updateAndSubmitForm(' c');
      assertQueryParam({ q: 'a b c' });
      cy.get('@input').should('have.value', 'a b c');
    });

    it('history updates url correctly', () => {
      search({ q: 'a' });
      cy.get('form').find('[type="text"]', { timeout: 10000 }).first().as('input').should('be.enabled');
      updateAndSubmitForm(' b');
      updateAndSubmitForm(' c');

      assertQueryParam({ q: 'a b c' });
      cy.get('@input').should('have.value', 'a b c');

      cy.go('back');
      assertQueryParam({ q: 'a b' });
      cy.get('@input').should('have.value', 'a b');

      cy.go('back');
      assertQueryParam({ q: 'a' });
      cy.get('@input').should('have.value', 'a');
    });

    it.only('sort change causes new search and updates URL', () => {
      search({ q: 'star' });
      cy.getByTestId('sort').children().first().as('sort');

      cy.get('input[name="sort"]').should('have.value', 'date desc');
      assertQueryParam({ sort: 'date desc' });

      cy.get('@sort').click().type('{downArrow}{downArrow}{enter}');
      assertQueryParam({ sort: 'entry_date desc' });
      cy.get('input[name="sort"]').should('have.value', 'entry_date desc');

      cy.get('@sort').find('button').click();
      assertQueryParam({ sort: 'entry_date asc' });
      cy.get('input[name="sort"]').should('have.value', 'entry_date asc');
    });
  });

  describe('Pagination', () => {});
});
