module.exports = {
  root: true,

  extends: ['@elastic/kibana', '@elastic/kibana/jest'],

  plugins: ['@elastic/eslint-plugin-kibana-custom', 'prettier'],

  rules: {
    quotes: 'off'
  },

  settings: {
    'import/resolver': [
      {
        '@elastic/eslint-import-resolver-kibana': {
          rootPackageName: 'x-pack',
          pluginDirs: ['./plugins']
        }
      }
    ]
  },

  overrides: [
    /**
     * Prettier
     */
    {
      files: ['plugins/apm/**/*', '.eslintrc.js'],
      rules: Object.assign(
        {
          'prettier/prettier': ['error']
        },
        require('eslint-config-prettier').rules,
        require('eslint-config-prettier/react').rules
      )
    },

    /**
     * Allow default exports
     */
    {
      files: ['test/functional/apps/**/*', 'plugins/apm/**/*'],
      rules: {
        'kibana-custom/no-default-export': 'off',
        'import/no-named-as-default': 'off'
      }
    },

    /**
     * Files that are not transpiled with babel
     */
    {
      files: [
        '.eslintrc.js',
        'gulpfile.js',
        'dev-tools/mocha/setup_mocha.js',
        'scripts/*',
        '**/webpackShims/**/*'
      ],
      rules: {
        'import/no-commonjs': 'off',
        'prefer-object-spread/prefer-object-spread': 'off',
        'no-restricted-syntax': [
          'error',
          'ImportDeclaration',
          'ExportNamedDeclaration',
          'ExportDefaultDeclaration',
          'ExportAllDeclaration'
        ]
      }
    },

    /**
     * APM overrides
     */
    {
      files: ['plugins/apm/**/*'],
      rules: {
        'no-unused-vars': ['error', { ignoreRestSiblings: true }]
      }
    },

    /**
     * Graph overrides
     */
    {
      files: ['plugins/graph/**/*'],
      globals: {
        angular: true,
        $: true
      },
      rules: {
        'block-scoped-var': 'off',
        camelcase: 'off',
        eqeqeq: 'off',
        'guard-for-in': 'off',
        'new-cap': 'off',
        'no-loop-func': 'off',
        'no-redeclare': 'off',
        'no-shadow': 'off',
        'no-unused-vars': 'off',
        'one-var': 'off'
      }
    },

    /**
     * ML overrides
     */
    {
      files: ['plugins/ml/**/*'],
      rules: {
        quotes: 'error',
        'no-shadow': 'error'
      }
    },

    /**
     * Monitoring overrides
     */
    {
      files: ['plugins/monitoring/**/*'],
      rules: {
        'block-spacing': ['error', 'always'],
        curly: ['error', 'all'],
        'no-unused-vars': ['error', { args: 'all', argsIgnorePattern: '^_' }],
        'no-else-return': 'error'
      }
    },
    {
      files: ['plugins/monitoring/public/**/*'],
      env: { browser: true }
    }
  ]
};
