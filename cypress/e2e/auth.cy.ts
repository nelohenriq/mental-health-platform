describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should load the homepage', () => {
    cy.contains('Mental Health Support Platform').should('be.visible');
  });

  it('should allow user registration', () => {
    cy.visit('/auth/register');

    cy.get('input[name="name"]').type('Test User');
    cy.get('input[name="email"]').type(`test${Date.now()}@example.com`);
    cy.get('input[name="password"]').type('TestPassword123!');
    cy.get('input[name="confirmPassword"]').type('TestPassword123!');

    cy.get('button[type="submit"]').click();

    // Should redirect to email verification or dashboard
    cy.url().should('not.include', '/auth/register');
  });

  it('should handle login with valid credentials', () => {
    cy.visit('/auth/login');

    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');

    cy.get('button[type="submit"]').click();

    // Should redirect to dashboard on successful login
    cy.url().should('include', '/dashboard');
  });

  it('should show error for invalid credentials', () => {
    cy.visit('/auth/login');

    cy.get('input[name="email"]').type('invalid@example.com');
    cy.get('input[name="password"]').type('wrongpassword');

    cy.get('button[type="submit"]').click();

    cy.contains('Invalid credentials').should('be.visible');
  });

  it('should allow password reset request', () => {
    cy.visit('/auth/forgot-password');

    cy.get('input[name="email"]').type('test@example.com');
    cy.get('button[type="submit"]').click();

    cy.contains('Password reset email sent').should('be.visible');
  });
});