## Using Marvel

The easiest way to get to know the new Marvel is probably by [reading the
docs](https://github.com/elastic/elasticsearch-marvel/blob/master/docs/index.asciidoc).
The second easiest way is to just install it.

- Install the marvel plugin on kibana `./bin/kibana plugin -i elasticsearch/marvel/latest`
- Install the License plugin on your cluster `./bin/elasticsearch-plugin install license`
- Install the Marvel agent on your cluster `./bin/elasticsearch-plugin install marvel-agent`

Once done, open up the following url (assuming standard kibana config):
[http://localhost:5601/app/marvel](http://localhost:5601/app/marvel).

## Developing

The best way to develop Marvel is with the latest supported version of Kibana
and the equivalent version of Elasticsearch and the Marvel-Agent ES plugin. The
easiest way to do this is configure your clusters and plugins using ESVM. Make
sure to always use the License and Shield plugins as well.

Sometimes you will need a special build of the Marvel Agent plugin. The best
way to do this is to build X-Plugins and Elasticsearch yourself.

To set up Marvel and automatic file syncing code changes into Kibana's plugin
directory, clone the kibana and x-plugins repos in the same directory and from
`x-plugins/kibana/marvel`, run:

```
npm install
npm start
```

Once the syncing process has run at least once, start the Kibana server in
development mode. It will handle restarting the server and re-optimizing the
bundles as-needed. Go to https://localhost:5601 and click Marvel from the App
Drawer.

## Running tests

```
npm run test
```

- Debug tests
Add a `debugger` line to create a breakpoint, and then:

```
gulp sync && mocha debug --compilers js:babel-register /pathto/kibana/installedPlugins/marvel/pathto/__test__/testfile.js
```

## Deploying

The `release task` creates archives and uploads them to
download.elasticsearch.org/elasticsearch/marvel/VERSION. You will need S3
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
