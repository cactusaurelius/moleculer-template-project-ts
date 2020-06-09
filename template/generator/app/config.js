exports.default = {
  options: {
    force: true
  },
  prompts: () => [
    {
      type: 'string',
      name: 'service_name',
      message: 'Service name'
    },
    {
      type: 'confirm',
      name: 'need_db',
      message: 'Component need to connect to database?',
      default: true
    }
  ],
  files: [
    {
      dir: 'src/types',
      index: 'index.ts',
      files: [
        {
          input: 'type.ts.ejs',
          output: '{serviceName}.ts'
        }]
    },
    {
      dir: 'tests/unit/services',
      files: [
        {
          input: 'tests/unit.ts.ejs',
          output: '{serviceName}.service.spec.ts'
        }
      ]
    },
    {
      dir: 'tests/integration/services',
      files: [
        {
          input: 'tests/integration.ts.ejs',
          output: '{serviceName}.service.integration.spec.ts'
        }
      ]
    },
    {
      dir: 'src/services',
      files: [
        {
          input: 'service.ts.ejs',
          output: '{serviceName}.service.ts'
        }
      ]
    },
    {
      dir: 'src/models',
      index: 'index.ts',
      needDB: true,
      files: [
        {
          input: 'db/model.ts.ejs',
          output: '{serviceName}.model.ts'
        }
      ]
    },
    {
      dir: 'src/mixins',
      index: 'index.ts',
      needDB: true,
      files: [
        {
          input: 'db/mixin.ts.ejs',
          output: 'db-{serviceName}.mixin.ts'
        }
      ]
    },
    {
      dir: 'src/entities',
      index: 'index.ts',
      needDB: true,
      files: [
        {
          input: 'db/entity.ts.ejs',
          output: '{serviceName}.entity.ts'
        }
      ]
    }
  ]
};
