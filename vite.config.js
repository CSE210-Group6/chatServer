// vite.config.js / vite.config.ts
import GithubActionsReporter from 'vitest-github-actions-reporter'

export default {
  test: {
    reporters: process.env.GITHUB_ACTIONS
      ? ['default', new GithubActionsReporter()]
      : 'default'
  }
}