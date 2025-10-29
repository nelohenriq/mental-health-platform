describe('Mood Tracking Flow', () => {
  beforeEach(() => {
    // Assume user is logged in
    cy.login('test@example.com', 'password123');
    cy.visit('/mood/log');
  });

  it('should display mood logging interface', () => {
    cy.contains('Log Your Mood').should('be.visible');
    cy.get('[data-testid="mood-scale"]').should('be.visible');
    cy.get('[data-testid="mood-notes"]').should('be.visible');
  });

  it('should allow logging a mood entry', () => {
    // Select mood level
    cy.get('[data-testid="mood-scale"]').find('button').eq(6).click(); // Mood level 7

    // Add notes
    cy.get('[data-testid="mood-notes"]').type('Feeling productive and positive today');

    // Add mood factors
    cy.get('[data-testid="mood-factor-exercise"]').check();
    cy.get('[data-testid="mood-factor-social"]').check();

    // Submit mood entry
    cy.get('[data-testid="submit-mood"]').click();

    // Should show success message
    cy.contains('Mood logged successfully').should('be.visible');

    // Should redirect to mood history or dashboard
    cy.url().should('not.include', '/mood/log');
  });

  it('should validate mood entry data', () => {
    // Try to submit without selecting mood level
    cy.get('[data-testid="submit-mood"]').click();

    // Should show validation error
    cy.contains('Please select a mood level').should('be.visible');

    // Now select mood and try again
    cy.get('[data-testid="mood-scale"]').find('button').first().click();
    cy.get('[data-testid="submit-mood"]').click();

    // Should succeed
    cy.contains('Mood logged successfully').should('be.visible');
  });

  it('should display mood history', () => {
    cy.visit('/mood/history');

    // Should show mood entries
    cy.get('[data-testid="mood-entry"]').should('have.length.greaterThan', 0);

    // Should show mood trends chart
    cy.get('[data-testid="mood-trends-chart"]').should('be.visible');

    // Should show mood statistics
    cy.contains('Average Mood').should('be.visible');
    cy.contains('Total Entries').should('be.visible');
  });

  it('should allow editing mood entries', () => {
    cy.visit('/mood/history');

    // Click edit on first mood entry
    cy.get('[data-testid="mood-entry"]').first().find('[data-testid="edit-mood"]').click();

    // Should navigate to edit page
    cy.url().should('include', '/edit');

    // Update mood level
    cy.get('[data-testid="mood-scale"]').find('button').eq(8).click(); // Change to 9

    // Update notes
    cy.get('[data-testid="mood-notes"]').clear().type('Actually feeling even better!');

    // Save changes
    cy.get('[data-testid="save-mood"]').click();

    // Should show success message
    cy.contains('Mood updated successfully').should('be.visible');
  });

  it('should allow deleting mood entries', () => {
    cy.visit('/mood/history');

    // Get initial count
    cy.get('[data-testid="mood-entry"]').its('length').as('initialCount');

    // Delete first mood entry
    cy.get('[data-testid="mood-entry"]').first().find('[data-testid="delete-mood"]').click();

    // Confirm deletion
    cy.get('[data-testid="confirm-delete"]').click();

    // Should show success message
    cy.contains('Mood entry deleted').should('be.visible');

    // Count should be reduced by 1
    cy.get('[data-testid="mood-entry"]').should('have.length.lessThan', '@initialCount');
  });

  it('should export mood data', () => {
    cy.visit('/mood/history');

    // Click export button
    cy.get('[data-testid="export-mood-data"]').click();

    // Should trigger download (can't easily test actual download in Cypress)
    // But we can check that the request was made
    cy.intercept('POST', '/api/user/export').as('exportRequest');

    cy.wait('@exportRequest').then((interception) => {
      expect(interception.response?.statusCode).to.equal(200);
    });
  });
});