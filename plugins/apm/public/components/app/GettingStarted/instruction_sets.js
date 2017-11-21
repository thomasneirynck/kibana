export const serverInstructions = [
  {
    id: 'deb',
    name: 'Debian',
    steps: [
      {
        indicatorNumber: 1,
        title: 'Download and unpack the APM Server',
        textPre:
          '[Download 32-bit](https://artifacts.elastic.co/downloads/apm-server/apm-server-6.1.0-i386.deb) – [Download 64-bit](https://artifacts.elastic.co/downloads/apm-server/apm-server-6.1.0-amd64.deb)',
        code: `32-bit: https://artifacts.elastic.co/downloads/apm-server/apm-server-6.1.0-i386.deb
64-bit: https://artifacts.elastic.co/downloads/apm-server/apm-server-6.1.0-amd64.deb`
      },
      {
        indicatorNumber: 2,
        title: 'Import dashboards (optional)',
        textPre: 'The APM Server ships with pre-configured dashboards.',
        code: './apm-server -setup',
        textPost:
          'If you using an X-Pack secured version of the Elastic Stack, add `-E output.elasticsearch.username=user -E output.elasticsearch.password=pass` to the command.'
      },
      {
        indicatorNumber: 3,
        title: 'Start the APM Server',
        textPre:
          'The server processes and stores application performance metrics in Elasticsearch.',
        code: './apm-server -e'
      },
      {
        indicatorNumber: 4,
        title: 'APM Server status',
        textPre:
          'Make sure the APM Server is running before you start implementing the APM agents.',
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
        title: 'Download and unpack the APM Server',
        textPre:
          '[Download 32-bit](https://artifacts.elastic.co/downloads/apm-server/apm-server-6.1.0-i686.rpm) – [Download 64-bit](https://artifacts.elastic.co/downloads/apm-server/apm-server-6.1.0-x86_64.rpm)',
        code: `32-bit: https://artifacts.elastic.co/downloads/apm-server/apm-server-6.1.0-amd64.deb
64-bit: https://artifacts.elastic.co/downloads/apm-server/apm-server-6.1.0-x86_64.rpm`
      },
      {
        indicatorNumber: 2,
        title: 'Import dashboards (optional)',
        textPre: 'The APM Server ships with pre-configured dashboards.',
        code: './apm-server -setup',
        textPost:
          'If you using an X-Pack secured version of the Elastic Stack, add `-E output.elasticsearch.username=user -E output.elasticsearch.password=pass` to the command.'
      },
      {
        indicatorNumber: 3,
        title: 'Start the APM Server',
        textPre:
          'The server processes and stores application performance metrics in Elasticsearch.',
        code: './apm-server -e'
      },
      {
        indicatorNumber: 4,
        title: 'APM Server status',
        textPre:
          'Make sure the APM Server is running before you start implementing the APM agents.',
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
        title: 'Download and unpack the APM Server',
        textPre:
          '[Download 32-bit](https://artifacts.elastic.co/downloads/apm-server/apm-server-6.1.0-linux-x86.tar.gz) – [Download 64-bit](https://artifacts.elastic.co/downloads/apm-server/apm-server-6.1.0-linux-x86_64.tar.gz)',
        code: `32-bit: https://artifacts.elastic.co/downloads/apm-server/apm-server-6.1.0-linux-x86.tar.gz
64-bit: https://artifacts.elastic.co/downloads/apm-server/apm-server-6.1.0-linux-x86_64.tar.gz`
      },
      {
        indicatorNumber: 2,
        title: 'Import dashboards (optional)',
        textPre: 'The APM Server ships with pre-configured dashboards.',
        code: './apm-server -setup',
        textPost:
          'If you using an X-Pack secured version of the Elastic Stack, add `-E output.elasticsearch.username=user -E output.elasticsearch.password=pass` to the command.'
      },
      {
        indicatorNumber: 3,
        title: 'Start the APM Server',
        textPre:
          'The server processes and stores application performance metrics in Elasticsearch.',
        code: './apm-server -e'
      },
      {
        indicatorNumber: 4,
        title: 'APM Server status',
        textPre:
          'Make sure the APM Server is running before you start implementing the APM agents.',
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
        title: 'Download and unpack the APM Server',
        textPre:
          '[Download link](https://artifacts.elastic.co/downloads/apm-server/apm-server-6.1.0-darwin-x86_64.tar.gz)',
        code:
          'https://artifacts.elastic.co/downloads/apm-server/apm-server-6.1.0-darwin-x86_64.tar.gz'
      },
      {
        indicatorNumber: 2,
        title: 'Import dashboards (optional)',
        textPre: 'The APM Server ships with pre-configured dashboards.',
        code: './apm-server -setup',
        textPost:
          'If you using an X-Pack secured version of the Elastic Stack, add `-E output.elasticsearch.username=user -E output.elasticsearch.password=pass` to the command.'
      },
      {
        indicatorNumber: 3,
        title: 'Start the APM Server',
        textPre:
          'The server processes and stores application performance metrics in Elasticsearch.',
        code: './apm-server -e'
      },
      {
        indicatorNumber: 4,
        title: 'APM Server status',
        textPre:
          'Make sure the APM Server is running before you start implementing the APM agents.',
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
        title: 'Download and unpack the APM Server',
        textPre:
          '[Download 32-bit](https://artifacts.elastic.co/downloads/apm-server/apm-server-6.1.0-windows-x86.zip) – [Download 64-bit](https://artifacts.elastic.co/downloads/apm-server/apm-server-6.1.0-windows-x86_64.zip)',
        code: `32-bit: https://artifacts.elastic.co/downloads/apm-server/apm-server-6.1.0-windows-x86.zip
64-bit: https://artifacts.elastic.co/downloads/apm-server/apm-server-6.1.0-windows-x86_64.zip`
      },
      {
        indicatorNumber: 2,
        title: 'Import dashboards (optional)',
        textPre: 'The APM Server ships with pre-configured dashboards.',
        code: './apm-server -setup',
        textPost:
          'If you using an X-Pack secured version of the Elastic Stack, add `-E output.elasticsearch.username=user -E output.elasticsearch.password=pass` to the command.'
      },
      {
        indicatorNumber: 3,
        title: 'Start the APM Server',
        textPre:
          'The server processes and stores application performance metrics in Elasticsearch.',
        code: './apm-server -e'
      },
      {
        indicatorNumber: 4,
        title: 'APM Server status',
        textPre:
          'Make sure the APM Server is running before you start implementing the APM agents.',
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
        indicatorNumber: 4,
        title: 'Install the APM agent',
        textPre:
          'Install the APM Agent for Node.js as a dependency to your application.',
        code: `npm install elastic-apm --save`
      },
      {
        indicatorNumber: 5,
        title: 'Configure the agent',
        textPre:
          'Agents are libraries that run inside of your application process. APM apps are created programmatically based on the `appName`. This agent supports Express, Koa, hapi, and custom Node.js.',
        codeLanguage: 'javascript',
        code: `// Add this to the VERY top of the first file loaded in your app
var apm = require('elastic-apm').start({
// Set required app name (allowed characters: a-z, A-Z, 0-9, -, _, and space)
    appName: '',
    // Use if APM Server requires a token
    secretToken: '',
    // Set custom APM Server URL (default: http://localhost:8200)
    serverUrl: ''
})`,
        textPost:
          'See [the documentation](https://www.elastic.co/guide/en/apm/agent/nodejs/current/index.html) for advanced usage. Babel users, please refer to the documentation.'
      },
      {
        indicatorNumber: 6,
        title: 'APM agent status',
        textPre:
          "Let's check that the agent is running and sending up data to the APM Server.",
        isStatusStep: true
      }
    ]
  },
  {
    id: 'django',
    name: 'Django',
    steps: [
      {
        indicatorNumber: 4,
        title: 'Install the APM agent',
        textPre:
          'Install the APM Agent for Python as a dependency to your application.',
        code: `$ pip install elastic-apm`
      },
      {
        indicatorNumber: 5,
        title: 'Configure the agent',
        textPre:
          'Agents are libraries that run inside of your application process. APM apps are created programmatically based on the `APP_NAME`.',
        codeLanguage: 'python',
        code: `# Add the agent to the installed apps
INSTALLED_APPS = (
  # ...
  'elasticapm.contrib.django',
)

# Choose an app name and optionally a secret token
ELASTIC_APM = {
  'APP_NAME': '<APP-NAME>',
  'SECRET_TOKEN': '<SECRET-TOKEN>',
}

# To send performance metrics, add our tracing middleware:
MIDDLEWARES = (
   'elasticapm.contrib.django.middleware.TracingMiddleware',
   #...
)
`,
        textPost:
          'See [the documentation](https://www.elastic.co/guide/en/apm/agent/python/current/django-support.html) for advanced usage.'
      },
      {
        indicatorNumber: 6,
        title: 'APM agent status',
        textPre:
          "Let's check that the agent is running and sending up data to the APM Server.",
        isStatusStep: true
      }
    ]
  },
  {
    id: 'flask',
    name: 'Flask',
    steps: [
      {
        indicatorNumber: 4,
        title: 'Install the APM agent',
        textPre:
          'Install the APM Agent for Python as a dependency to your application.',
        code: `$ pip install elastic-apm[flask]`
      },
      {
        indicatorNumber: 5,
        title: 'Configure the agent',
        textPre:
          'Agents are libraries that run inside of your application process. APM apps are created programmatically based on the `APP_NAME`.',
        codeLanguage: 'python',
        code: `# initialize using environment variables from elasticapm.contrib.flask import ElasticAPM
app = Flask(__name__)
apm = ElasticAPM(app)

# configure to use ELASTIC_APM in your application's settings from elasticapm.contrib.flask import ElasticAPM
app.config['ELASTIC_APM'] = {
    # allowed app_name chars: a-z, A-Z, 0-9, -, _, and space from elasticapm.contrib.flask
   'APP_NAME': '',
   'SECRET_TOKEN': '',
}
apm = ElasticAPM(app)
`,
        textPost:
          'See [the documentation](https://www.elastic.co/guide/en/apm/agent/python/current/flask-support.html) for advanced usage.'
      },
      {
        indicatorNumber: 6,
        title: 'APM agent status',
        textPre:
          "Let's check that the agent is running and sending up data to the APM Server.",
        isStatusStep: true
      }
    ]
  }
];
