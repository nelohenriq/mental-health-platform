import { expect } from '@jest/globals';
import { checkAccessibility, generateAccessibilityReport, testKeyboardNavigation } from '../../src/lib/accessibility/accessibility-testing';

describe('WCAG Compliance Testing', () => {
  describe('checkAccessibility', () => {
    it('should identify accessibility violations', async () => {
      const html = `
        <div>
          <img src="image.jpg" />
          <button onclick="submit()">Submit</button>
          <input type="text" />
        </div>
      `;

      const results = await checkAccessibility(html);

      expect(results.violations.length).toBeGreaterThan(0);
      expect(results.violations.some(v => v.rule === 'image-alt')).toBe(true);
      expect(results.violations.some(v => v.rule === 'button-name')).toBe(false); // onclick is allowed but not preferred
    });

    it('should validate WCAG 2.1 AA compliance', async () => {
      const accessibleHtml = `
        <div>
          <img src="image.jpg" alt="Descriptive alt text" />
          <button aria-label="Submit form">Submit</button>
          <label for="name">Name:</label>
          <input id="name" type="text" aria-describedby="name-help" />
          <div id="name-help">Enter your full name</div>
        </div>
      `;

      const results = await checkAccessibility(accessibleHtml);

      expect(results.score).toBeGreaterThan(80);
      expect(results.level).toBe('AA');
      expect(results.violations.filter(v => v.impact === 'critical').length).toBe(0);
    });

    it('should check color contrast ratios', async () => {
      const poorContrastHtml = `
        <div style="color: #999999; background: #FFFFFF;">
          <p>Light gray text on white background</p>
        </div>
      `;

      const results = await checkAccessibility(poorContrastHtml);

      expect(results.violations.some(v => v.rule === 'color-contrast')).toBe(true);
      expect(results.score).toBeLessThan(90);
    });

    it('should validate form accessibility', async () => {
      const badFormHtml = `
        <form>
          <input type="text" />
          <input type="email" />
          <input type="submit" value="Send" />
        </form>
      `;

      const results = await checkAccessibility(badFormHtml);

      expect(results.violations.some(v => v.rule === 'label' || v.rule === 'form-field-multiple-labels')).toBe(true);
    });
  });

  describe('generateAccessibilityReport', () => {
    it('should generate comprehensive accessibility report', () => {
      const mockResults = {
        score: 85,
        level: 'AA' as const,
        violations: [
          {
            rule: 'image-alt',
            impact: 'critical' as const,
            description: 'Images must have alt text',
            elements: ['img[src="logo.jpg"]'],
            help: 'Add alt attribute to img elements',
          },
          {
            rule: 'color-contrast',
            impact: 'serious' as const,
            description: 'Color contrast ratio too low',
            elements: ['.text-light'],
            help: 'Increase contrast ratio to at least 4.5:1',
          },
        ],
        summary: {
          passed: 45,
          failed: 3,
          incomplete: 2,
          inapplicable: 10,
        },
      };

      const report = generateAccessibilityReport(mockResults);

      expect(report.overallScore).toBe(85);
      expect(report.complianceLevel).toBe('AA');
      expect(report.criticalIssues).toBe(1);
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.priorityActions).toContain('Fix missing alt text');
    });

    it('should prioritize critical accessibility issues', () => {
      const criticalResults = {
        score: 65,
        level: 'A' as const,
        violations: [
          {
            rule: 'image-alt',
            impact: 'critical' as const,
            description: 'Missing alt text',
            elements: ['img'],
            help: 'Add alt text',
          },
        ],
        summary: { passed: 30, failed: 10, incomplete: 5, inapplicable: 5 },
      };

      const report = generateAccessibilityReport(criticalResults);

      expect(report.priorityActions).toContain('critical');
      expect(report.complianceLevel).toBe('A');
      expect(report.recommendations).toContain('immediate attention');
    });
  });

  describe('testKeyboardNavigation', () => {
    it('should test keyboard accessibility', async () => {
      const html = `
        <div>
          <a href="#main">Skip to main</a>
          <button>Button 1</button>
          <button disabled>Disabled Button</button>
          <a href="/page">Link</a>
          <input type="text" />
          <select>
            <option>Option 1</option>
            <option>Option 2</option>
          </select>
        </div>
      `;

      const keyboardResults = await testKeyboardNavigation(html);

      expect(keyboardResults.focusableElements).toBe(5); // Skip link, button1, link, input, select
      expect(keyboardResults.tabOrder).toBeDefined();
      expect(keyboardResults.issues.length).toBe(0); // No issues in this example
    });

    it('should detect keyboard navigation issues', async () => {
      const badHtml = `
        <div>
          <div onclick="doSomething()" style="cursor: pointer;">Clickable div</div>
          <span onclick="doSomething()" style="cursor: pointer;">Clickable span</span>
        </div>
      `;

      const keyboardResults = await testKeyboardNavigation(badHtml);

      expect(keyboardResults.issues.length).toBeGreaterThan(0);
      expect(keyboardResults.issues.some(issue => issue.includes('keyboard'))).toBe(true);
    });

    it('should validate focus management', async () => {
      const modalHtml = `
        <div>
          <button>Open Modal</button>
          <div role="dialog" aria-modal="true" style="display: none;">
            <h2>Modal Title</h2>
            <input type="text" />
            <button>Close</button>
          </div>
        </div>
      `;

      const keyboardResults = await testKeyboardNavigation(modalHtml);

      expect(keyboardResults.focusManagement).toBeDefined();
      expect(keyboardResults.ariaAttributes).toContain('aria-modal');
    });
  });
});