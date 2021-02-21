/**
 * @typedef {import("ts-jest/dist/types")}
 * @type {import("@jest/types").Config.InitialOptions}
 */
module.exports = {
    roots: [
        './src',
        './e2e'
    ],
    // Transform: {
    //   "^.+\\.tsx?$": "ts-jest"
    // },
    preset:     'ts-jest',
    setupFiles: ['<rootDir>/jest.setup.js']
};
