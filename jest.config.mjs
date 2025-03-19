export default {
  transform: {
    "^.+\\.(js|ts|tsx)$": "babel-jest",
  },
  transformIgnorePatterns: [
    "/node_modules/(?!your-es-module|another-module-to-transform)/",
  ],
  setupFiles: ["./jest_config/jest.setup.js"],
};
