import "@testing-library/jest-dom";

// Polyfill for web APIs in Node.js environment
global.TextDecoder = global.TextDecoder || require("util").TextDecoder;
global.TextEncoder = global.TextEncoder || require("util").TextEncoder;
global.setImmediate = global.setImmediate || require("timers").setImmediate;

const {
  Request,
  Response,
} = require("next/dist/compiled/@edge-runtime/primitives");
global.Request = global.Request || Request;
global.Response = global.Response || Response;

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "/";
  },
}));

// Mock environment variables
process.env.NEXTAUTH_URL = "http://localhost:3000";
process.env.NEXTAUTH_SECRET = "test-secret";

// Mock Next.js async storage for request context
jest.mock(
  "next/dist/server/app-render/work-unit-async-storage.external",
  () => ({
    getExpectedRequestStore: jest.fn(() => ({
      headers: new Map([["authorization", "Bearer test-token"]]),
    })),
  })
);

// Mock Next.js headers function
jest.mock("next/headers", () => ({
  headers: jest.fn(() => new Map([["authorization", "Bearer test-token"]])),
}));

// Global test utilities
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;
