module.exports = {
  extends: [ '@cenk1cenk2/eslint-config/typescript' ],
  rules: {
    'import/order': [
      'error',
      {
        pathGroups: [
          {
            pattern: '@src/**',
            group: 'index'
          },
          {
            pattern: '@helpers/**',
            group: 'index'
          },
          {
            pattern: '@interfaces/**',
            group: 'index'
          },
          {
            pattern: '@lib/**',
            group: 'index'
          },
          {
            pattern: '@base/**',
            group: 'index'
          },
          {
            pattern: '@extend/**',
            group: 'index'
          },
          {
            pattern: '@templates/**',
            group: 'index'
          },
          {
            pattern: '@utils/**',
            group: 'index'
          }
        ],
        pathGroupsExcludedImportTypes: [ 'builtin' ],
        groups: [
          [ 'builtin', 'external' ],
          [ 'index', 'parent', 'sibling' ]
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true
        }
      }
    ]
  }
}
