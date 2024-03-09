// vite.config.js / vite.config.ts
import GithubActionsReporter from 'vitest-github-actions-reporter'
import { defineConfig } from 'vite';

export default {
    test: {
        reporters: process.env.GITHUB_ACTIONS
            ? ['default', new GithubActionsReporter()]
            : 'default',
        coverage: {
            // you can include other reporters, but 'json-summary' is required, json is recommended
            reporter: ['text', 'json-summary', 'json'],
            // If you want a coverage reports even if your tests are failing, include the reportOnFailure option
            reportOnFailure: true,
        }
    }
}