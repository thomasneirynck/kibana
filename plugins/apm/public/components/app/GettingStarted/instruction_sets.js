export const serverInstructions = [
  {
    id: 'macos',
    name: 'MacOS',
    steps: [
      {
        indicatorNumber: 1,
        title: 'Download and unpack the APM Server',
        textPre:
          'Run the following curl command to download and unpack the APM Server.',
        code: `curl -L -0 https://artifacts.elastic.co/downloads/apm-server/apm-server-6.0.0-rc1-darwin-x86_64.tar.gz 
  >tar xzvf apm-server-6.0.0-rc1-darwin-x86_64.tar.gz`
      },
      {
        indicatorNumber: 2,
        title: 'Start the APM Server',
        textPre:
          'The server processes and stores application performance metrics in Elasticsearch.',
        code: './apm-server -e'
      },
      {
        indicatorNumber: 3,
        title: 'APM Server status',
        textPre:
          'Make sure the APM Server is running before you go and implement the APM agents.',
        isStatusStep: true
      }
    ]
  },
  {
    id: 'deb',
    name: 'Debian',
    steps: [
      {
        indicatorNumber: 1,
        title: 'Download and install the APM Server',
        textPre:
          'Run the following commands to download and install the APM Server.',
        code: `# Download the package
curl -L -O https://artifacts.elastic.co/downloads/apm-server/apm-server-6.0.0-rc2-amd64.deb

# Install the package
sudo dpkg -i apm-server-6.0.0-rc2-amd64.deb`
      },
      {
        indicatorNumber: 2,
        title: 'Start the APM Server',
        textPre:
          'The server processes and stores application performance metrics in Elasticsearch.',
        code: 'apm-server -e'
      },
      {
        indicatorNumber: 3,
        title: 'APM Server status',
        textPre:
          'Make sure the APM Server is running before you go and implement the APM agents.',
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
        title: 'Download and install the APM Server',
        textPre:
          'Run the following commands to download and install the APM Server.',
        code: `# Download the package
curl -L -O https://artifacts.elastic.co/downloads/apm-server/apm-server-6.0.0-rc2-x86_64.rpm

# Install the package
sudo rpm -vi apm-server-6.0.0-rc2-x86_64.rpm`
      },
      {
        indicatorNumber: 2,
        title: 'Start the APM Server',
        textPre:
          'The server processes and stores application performance metrics in Elasticsearch.',
        code: 'apm-server -e'
      },
      {
        indicatorNumber: 3,
        title: 'APM Server status',
        textPre:
          'Make sure the APM Server is running before you go and implement the APM agents.',
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
          'Download either a **32-bit** or **64-bit** version of APM Server for Windows from [the downloads page](https://www.elastic.co/downloads/apm/apm-server).'
      },
      {
        indicatorNumber: 2,
        title: 'Start the APM Server',
        textPre:
          'The server processes and stores application performance metrics in Elasticsearch.',
        code: '$HOMEDIR\\apm-server -e'
      },
      {
        indicatorNumber: 3,
        title: 'APM Server status',
        textPre:
          'Make sure the APM Server is running before you go and implement the APM agents.',
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
        title: 'Download and run the APM Server in Docker',
        textPre: 'Pull the APM Server image from the Elastic Docker registry.',
        code: `docker run -v ~/apm-server.yml:/usr/share/apm-server/apm-server.yml docker.elastic.co/apm/apm-server:6.0.0-rc2`
      },
      {
        indicatorNumber: 2,
        title: 'APM Server status',
        textPre:
          'Make sure the APM Server is running before you go and implement the APM agents.',
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
        indicatorNumber: 3,
        title: 'Install the APM agent',
        textPre:
          'Install the APM Agent for Node.js as a dependency to your application.',
        code: `npm install elastic-apm --save`
      },
      {
        indicatorNumber: 4,
        title: 'Configure the agent',
        textPre:
          'Agents are libraries that run inside of your application process. The agent supports Express, Koa, hapi, and custom Node.js.',
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
        indicatorNumber: 5,
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
        indicatorNumber: 3,
        title: 'Install the APM agent',
        textPre:
          'Install the APM Agent for Python as a dependency to your application.',
        code: `$ pip install elastic-apm`
      },
      {
        indicatorNumber: 4,
        title: 'Configure the agent',
        textPre:
          'Agents are libraries that run inside of your application process.',
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
`,
        textPost:
          'See [the documentation](https://www.elastic.co/guide/en/apm/agent/python/current/django-support.html) for advanced usage.'
      },
      {
        indicatorNumber: 5,
        title: 'APM agent status',
        textPre:
          "Let's check that the agent is running and sending up data to the APM Server.",
        isStatusStep: true
      }
    ]
  }
];
