## Using Monitoring

The easiest way to get to know the new Monitoring is probably by [reading the
docs](https://github.com/elastic/elasticsearch-monitoring/blob/master/docs/index.asciidoc).
The second easiest way is to just install it.

- Install the monitoring plugin on kibana `./bin/kibana plugin -i elasticsearch/monitoring/latest`
- Install the License plugin on your cluster `./bin/elasticsearch-plugin install license`
- Install the Monitoring agent on your cluster `./bin/elasticsearch-plugin install monitoring-agent`

Once done, open up the following url (assuming standard kibana config):
[http://localhost:5601/app/monitoring](http://localhost:5601/app/monitoring).

## Developing

The best way to develop Monitoring is with the latest supported version of Kibana
and the equivalent version of Elasticsearch and the Monitoring-Agent ES plugin. The
easiest way to do this is configure your clusters and plugins using ESVM. Make
sure to always use the License and Shield plugins as well.

Sometimes you will need a special build of the Monitoring Agent plugin. The best
way to do this is to build X-Plugins and Elasticsearch yourself.

To set up Monitoring and automatic file syncing code changes into Kibana's plugin
directory, clone the kibana and x-plugins repos in the same directory and from
`x-plugins/kibana/monitoring`, run:

```
npm install
npm start
```

Once the syncing process has run at least once, start the Kibana server in
development mode. It will handle restarting the server and re-optimizing the
bundles as-needed. Go to https://localhost:5601 and click Monitoring from the App
Drawer.

## Running tests

```
npm run test
```

- Debug tests
Add a `debugger` line to create a breakpoint, and then:

```
gulp sync && mocha debug --compilers js:babel-register /pathto/kibana/installedPlugins/monitoring/pathto/__test__/testfile.js
```

## Deploying

The `release task` creates archives and uploads them to
download.elasticsearch.org/elasticsearch/monitoring/VERSION. You will need S3
credentials in `$HOME/.aws-config.json`. Format as so:

```
{
  "key":"MY_KEY_HERE",
  "secret":"your/long/secret/string"
}
```

To upload the current archive as the "latest" release, use:

```
gulp release
```
