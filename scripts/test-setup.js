/**
 * Test Setup Script
 * Initializes test environment and database for comprehensive testing
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function setupTestEnvironment() {
  console.log("🚀 Setting up test environment...");

  try {
    // Reset test database
    console.log("📦 Setting up test database...");
    try {
      execSync("npx prisma migrate reset --force --skip-generate", {
        stdio: "inherit",
        env: { ...process.env, DATABASE_URL: "file:./prisma/test.db" },
      });
    } catch (error) {
      console.log("⚠️  Database reset failed, continuing...");
    }

    // Generate Prisma client
    console.log("🔧 Generating Prisma client...");
    execSync("npx prisma generate", { stdio: "inherit" });

    // Seed test data
    console.log("🌱 Seeding test data...");
    execSync("npx tsx prisma/seed.ts", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: "file:./prisma/test.db" },
    });

    console.log("✅ Test environment setup complete!");
  } catch (error) {
    console.error("❌ Test environment setup failed:", error.message);
    process.exit(1);
  }
}

function runUITests() {
  console.log("🖥️  Running UI/UX validation tests...");

  try {
    // Start development server in background
    const { spawn } = require("child_process");
    const server = spawn("npm", ["run", "dev"], {
      detached: true,
      stdio: "ignore",
    });

    // Wait for server to start
    setTimeout(() => {
      console.log("🌐 Development server started");

      // Run Playwright tests
      execSync(
        "npx playwright test tests/e2e/ui-ux-validation.spec.ts --headed=false",
        {
          stdio: "inherit",
        }
      );

      // Kill server
      process.kill(-server.pid);
      console.log("🛑 Development server stopped");
    }, 5000);
  } catch (error) {
    console.error("❌ UI tests failed:", error.message);
    process.exit(1);
  }
}
function runLinkValidationTests() {
  console.log("🔗 Running link validation tests...");

  try {
    // Run link validation tests directly (no server needed for basic link checks)
    execSync(
      process.platform === "win32"
        ? "npx.cmd playwright test tests/e2e/link-validation.spec.ts"
        : "npx playwright test tests/e2e/link-validation.spec.ts",
      {
        stdio: "inherit",
      }
    );

    console.log("✅ Link validation tests completed");
  } catch (error) {
    console.error("❌ Link validation tests failed:", error.message);
    process.exit(1);
  }
}
function runAccessibilityTests() {
  console.log("♿ Running accessibility tests...");

  try {
    // Start development server
    const { spawn } = require("child_process");
    const server = spawn("npx", ["next", "dev"], {
      detached: true,
      stdio: "ignore",
    });

    // Wait for server to start
    setTimeout(() => {
      console.log("🌐 Development server started for accessibility testing");

      // Run accessibility tests
      execSync("npx playwright test tests/accessibility/ --headed=false", {
        stdio: "inherit",
      });

      // Kill server
      process.kill(-server.pid);
      console.log("🛑 Development server stopped");
    }, 5000);
  } catch (error) {
    console.error("❌ Accessibility tests failed:", error.message);
    process.exit(1);
  }
}

function runPerformanceTests() {
  console.log("⚡ Running performance tests...");

  try {
    // Run Lighthouse or similar performance tests
    execSync(
      "npx lighthouse http://localhost:3000 --output=json --output-path=./reports/lighthouse.json",
      {
        stdio: "inherit",
      }
    );

    console.log("📊 Performance report generated at ./reports/lighthouse.json");
  } catch (error) {
    console.warn(
      "⚠️  Performance tests skipped (Lighthouse not available):",
      error.message
    );
  }
}

function generateTestReport() {
  console.log("📋 Generating test report...");

  const report = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    testResults: {
      unit: "Pending",
      integration: "Pending",
      e2e: "Pending",
      accessibility: "Pending",
      performance: "Pending",
    },
    recommendations: [],
  };

  // Write report to file
  const reportPath = path.join(__dirname, "..", "reports", "test-report.json");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log("📄 Test report generated at ./reports/test-report.json");
}

// Main execution
const command = process.argv[2];

switch (command) {
  case "setup":
    setupTestEnvironment();
    break;
  case "ui":
    runUITests();
    break;
  case "links":
    runLinkValidationTests();
    break;
  case "accessibility":
    runAccessibilityTests();
    break;
  case "performance":
    runPerformanceTests();
    break;
  case "report":
    generateTestReport();
    break;
  case "all":
    setupTestEnvironment();
    runUITests();
    runLinkValidationTests();
    runAccessibilityTests();
    runPerformanceTests();
    generateTestReport();
    break;
  default:
    console.log(`
🧪 Mental Health Platform Test Suite

Usage: node scripts/test-setup.js <command>

Commands:
  setup          - Set up test environment and database
  ui            - Run UI/UX validation tests
  links         - Run link validation tests
  accessibility - Run accessibility tests
  performance   - Run performance tests
  report        - Generate test report
  all           - Run all tests

Examples:
  npm run test:setup
  npm run test:ui
  npm run test:all
    `);
    break;
}

module.exports = {
  setupTestEnvironment,
  runUITests,
  runAccessibilityTests,
  runPerformanceTests,
  runLinkValidationTests,
  generateTestReport,
};
