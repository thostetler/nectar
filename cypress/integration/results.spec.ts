import { beforeEach, cy, describe, it } from 'local-cypress';

describe('Results Page URL sync', () => {
  beforeEach(() => {
    cy.visit('http://localhost:8000/search', {
      qs: {
        q: 'star',
        sort: 'date desc',
        p: 1,
      },
    });
  });
  it('searchbar shows correct search term', () => {
    cy.get('form').find('[type="text"]').first().should('have.value', 'star');
  });

  it.only('submission updates url correctly', () => {
    cy.wait(500);
    cy.get('form').find('[type="text"]').first().as('input');
    cy.get('@input').type(' a');
    cy.get('form').submit();
    cy.wait(500);
    cy.get('@input').type(' b');
    cy.get('form').submit();
    cy.wait(500);
    cy.get('@input').type(' c');
    cy.get('form').submit();
    cy.wait(500);
    cy.get('@input').type(' d');
    cy.get('form').submit();
  });
});
