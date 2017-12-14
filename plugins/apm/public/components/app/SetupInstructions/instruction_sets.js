export const serverInstructions = [
  {
    id: 'deb',
    name: 'Debian',
    steps: [
      {
        indicatorNumber: 1,
        title: 'Download and unpack APM Server for Debian',
        downloadButton: true
      },
      {
        indicatorNumber: 2,
        title: 'Import dashboards (optional)',
        textPre: 'APM Server ships with pre-configured dashboards.',
        code: './apm-server -setup',
        textPost:
          'If you are using an X-Pack secured version of the Elastic Stack, add `-E output.elasticsearch.username=user -E output.elasticsearch.password=pass` to the command.'
      },
      {
        indicatorNumber: 3,
        title: 'Start APM Server',
        textPre:
          'The server processes and stores application performance metrics in Elasticsearch.',
        code: './apm-server -e'
      },
      {
        indicatorNumber: 4,
        title: 'APM Server status',
        textPre:
          'Make sure APM Server is running before you start implementing the APM agents.',
        isStatusStep: true
      }
    ]
  },
  {
    id: 'rpm',
    name: 'RPM',
    steps: [
      {
        indicatorNumber: 1,
        title: 'Download and unpack APM Server for RPM',
        downloadButton: true
      },
      {
        indicatorNumber: 2,
        title: 'Import dashboards (optional)',
        textPre: 'APM Server ships with pre-configured dashboards.',
        code: './apm-server -setup',
        textPost:
          'If you are using an X-Pack secured version of the Elastic Stack, add `-E output.elasticsearch.username=user -E output.elasticsearch.password=pass` to the command.'
      },
      {
        indicatorNumber: 3,
        title: 'Start APM Server',
        textPre:
          'The server processes and stores application performance metrics in Elasticsearch.',
        code: './apm-server -e'
      },
      {
        indicatorNumber: 4,
        title: 'APM Server status',
        textPre:
          'Make sure APM Server is running before you start implementing the APM agents.',
        isStatusStep: true
      }
    ]
  },
  {
    id: 'linux',
    name: 'Linux',
    steps: [
      {
        indicatorNumber: 1,
        title: 'Download and unpack APM Server for Linux',
        downloadButton: true
      },
      {
        indicatorNumber: 2,
        title: 'Import dashboards (optional)',
        textPre: 'APM Server ships with pre-configured dashboards.',
        code: './apm-server -setup',
        textPost:
          'If you are using an X-Pack secured version of the Elastic Stack, add `-E output.elasticsearch.username=user -E output.elasticsearch.password=pass` to the command.'
      },
      {
        indicatorNumber: 3,
        title: 'Start APM Server',
        textPre:
          'The server processes and stores application performance metrics in Elasticsearch.',
        code: './apm-server -e'
      },
      {
        indicatorNumber: 4,
        title: 'APM Server status',
        textPre:
          'Make sure APM Server is running before you start implementing the APM agents.',
        isStatusStep: true
      }
    ]
  },
  {
    id: 'mac',
    name: 'Mac',
    steps: [
      {
        indicatorNumber: 1,
        title: 'Download and unpack APM Server for Mac',
        downloadButton: true
      },
      {
        indicatorNumber: 2,
        title: 'Import dashboards (optional)',
        textPre: 'APM Server ships with pre-configured dashboards.',
        code: './apm-server -setup',
        textPost:
          'If you are using an X-Pack secured version of the Elastic Stack, add `-E output.elasticsearch.username=user -E output.elasticsearch.password=pass` to the command.'
      },
      {
        indicatorNumber: 3,
        title: 'Start APM Server',
        textPre:
          'The server processes and stores application performance metrics in Elasticsearch.',
        code: './apm-server -e'
      },
      {
        indicatorNumber: 4,
        title: 'APM Server status',
        textPre:
          'Make sure APM Server is running before you start implementing the APM agents.',
        isStatusStep: true
      }
    ]
  },
  {
    id: 'win',
    name: 'Windows',
    steps: [
      {
        indicatorNumber: 1,
        title: 'Download and unpack APM Server for Windows',
        downloadButton: true
      },
      {
        indicatorNumber: 2,
        title: 'Import dashboards (optional)',
        textPre: 'APM Server ships with pre-configured dashboards.',
        code: 'apm-server.exe -setup',
        textPost:
          'If you are using an X-Pack secured version of the Elastic Stack, add `-E output.elasticsearch.username=user -E output.elasticsearch.password=pass` to the command.'
      },
      {
        indicatorNumber: 3,
        title: 'Start APM Server',
        textPre:
          'The server processes and stores application performance metrics in Elasticsearch.',
        code: 'apm-server.exe -e'
      },
      {
        indicatorNumber: 4,
        title: 'APM Server status',
        textPre:
          'Make sure APM Server is running before you start implementing the APM agents.',
        isStatusStep: true
      }
    ]
  },
  {
    id: 'docker',
    name: 'Docker',
    steps: [
      {
        indicatorNumber: 1,
        title: 'Run APM Server in Docker',
        textPre: 'Start APM Server image in Docker.',
        code: `docker run -p 8200:8200 docker.elastic.co/apm/apm-server:6.1.0 apm-server -e -E output.elasticsearch.hosts=ElasticsearchAddress:9200 -E apm-server.host=:8200`,
        textPost: `If you are using an X-Pack secured version of the Elastic Stack, add \`-E output.elasticsearch.username=user -E output.elasticsearch.password=pass\` to the command. Read more in the [APM Server on Docker](https://www.elastic.co/guide/en/apm/server/6.1/running-on-docker.html) documentation.`
      },
      {
        indicatorNumber: 2,
        title: 'APM Server status',
        textPre:
          'Make sure APM Server is running before you go and implement the APM agents.',
        isStatusStep: true
      }
    ]
  }
];

export const agentInstructions = [
  {
    id: 'node',
    name: 'Node.js',
    steps: [
      {
        indicatorNumber: 1,
        title: 'Install the APM agent',
        textPre:
          'Install the APM agent for Node.js as a dependency to your application.',
        code: `npm install elastic-apm --save`
      },
      {
        indicatorNumber: 2,
        title: 'Configure the agent',
        textPre:
          'Agents are libraries that run inside of your application process. APM services are created programmatically based on the `serviceName`. This agent supports Express, Koa, hapi, and custom Node.js.',
        codeLanguage: 'javascript',
        code: `// Add this to the VERY top of the first file loaded in your application
var apm = require('elastic-apm').start({
    // Set required service name (allowed characters: a-z, A-Z, 0-9, -, _, and space)
    serviceName: '',
    // Use if APM Server requires a token
    secretToken: '',
    // Set custom APM Server URL (default: http://localhost:8200)
    serverUrl: ''
})`,
        textPost:
          'See [the documentation](https://www.elastic.co/guide/en/apm/agent/nodejs/current/index.html) for advanced usage. Babel users, please refer to the documentation.'
      },
      {
        indicatorNumber: 3,
        title: 'APM agent status',
        textPre:
          "Let's check that the agent is running and sending up data to APM Server.",
        isStatusStep: true
      }
    ]
  },
  {
    id: 'django',
    name: 'Django',
    steps: [
      {
        indicatorNumber: 1,
        title: 'Install the APM agent',
        textPre: 'Install the APM agent for Python as a dependency.',
        code: `$ pip install elastic-apm`
      },
      {
        indicatorNumber: 2,
        title: 'Configure the agent',
        textPre:
          'Agents are libraries that run inside of your application process. APM services are created programmatically based on the `SERVICE_NAME`.',
        codeLanguage: 'python',
        code: `# Add the agent to INSTALLED_APPS
INSTALLED_APPS = (
  'elasticapm.contrib.django',
  # ...
)

# Choose a service name and optionally a secret token
ELASTIC_APM = {
  'SERVICE_NAME': '<SERVICE-NAME>',
  'SECRET_TOKEN': '<SECRET-TOKEN>',
}

# To send performance metrics, add our tracing middleware:
MIDDLEWARE = (
'elasticapm.contrib.django.middleware.TracingMiddleware',
#...
)
`,
        textPost:
          'See [the documentation](https://www.elastic.co/guide/en/apm/agent/python/current/django-support.html) for advanced usage.'
      },
      {
        indicatorNumber: 3,
        title: 'APM agent status',
        textPre:
          "Let's check that the agent is running and sending up data to APM Server.",
        isStatusStep: true
      }
    ]
  },
  {
    id: 'flask',
    name: 'Flask',
    steps: [
      {
        indicatorNumber: 1,
        title: 'Install the APM agent',
        textPre: 'Install the APM agent for Python as a dependency.',
        code: `$ pip install elastic-apm[flask]`
      },
      {
        indicatorNumber: 2,
        title: 'Configure the agent',
        textPre:
          'Agents are libraries that run inside of your application process. APM services are created programmatically based on the `SERVICE_NAME`.',
        codeLanguage: 'python',
        code: `# initialize using environment variables from elasticapm.contrib.flask import ElasticAPM
app = Flask(__name__)
apm = ElasticAPM(app)

# configure to use ELASTIC_APM in your application's settings from elasticapm.contrib.flask import ElasticAPM
app.config['ELASTIC_APM'] = {
    # allowed SERVICE_NAME chars: a-z, A-Z, 0-9, -, _, and space from elasticapm.contrib.flask
   'SERVICE_NAME': '',
   'SECRET_TOKEN': '',
}
apm = ElasticAPM(app)
`,
        textPost:
          'See [the documentation](https://www.elastic.co/guide/en/apm/agent/python/current/flask-support.html) for advanced usage.'
      },
      {
        indicatorNumber: 3,
        title: 'APM agent status',
        textPre:
          "Let's check that the agent is running and sending up data to APM Server.",
        isStatusStep: true
      }
    ]
  }
];
