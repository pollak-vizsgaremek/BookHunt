export default {
  transform: {}, // We use native Node ESM via --experimental-vm-modules
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1', // Maps explicit .js imports in ESM
  },
  testEnvironment: 'node',
};
