module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\.(css|less|scss)$': 'identity-obj-proxy',
    '\.(png|jpg|jpeg|gif|svg|webp)$': '<rootDir>/src/__tests__/fileMock.js',
  },
  testMatch: ['<rootDir>/src/**/*.test.{js,jsx}'],
  collectCoverageFrom: ['src/**/*.{js,jsx}', '!src/main.jsx', '!src/**/*.test.{js,jsx}'],
};
