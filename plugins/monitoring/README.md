## Using Monitoring

The easiest way to get to know the new Monitoring is probably by [reading the
docs](https://github.com/elastic/x-plugins/blob/master/docs/public/marvel/index.asciidoc).

Install the distribution the way a customer would is pending the first release
of Unified X-Pack plugins.

## Developing

You will need to get Elasticsearch and X-Pack plugins for ES that match the
version of the UI. The best way to do this is to run `gradle run` from a clone
of the x-plugins repository.

To set up Monitoring and automatic file syncing code changes into Kibana's plugin
directory, clone the kibana and x-plugins repos in the same directory and from
`x-plugins/kibana/monitoring`, run `npm start`.

Once the syncing process has run at least once, start the Kibana server in
development mode. It will handle restarting the server and re-optimizing the
bundles as-needed. Go to https://localhost:5601 and click Monitoring from the App
Drawer.

## Running tests

- Run the command:
  ```
  npm run test
  ```

- Debug tests
Add a `debugger` line to create a breakpoint, and then:

  ```
  gulp sync && mocha debug --compilers js:babel-register /pathto/kibana/plugins/monitoring/pathto/__test__/testfile.js
  ```

## Deploying

Monitoring is part of XPack, and only a single XPack artifact needs to be
deployed. Previously, the instructions to deploy were:

> The `release task` creates archives and uploads them to
download.elasticsearch.org/elasticsearch/monitoring/VERSION. You will need S3
credentials in `$HOME/.aws-config.json`. Format as so:

> ```
> {
>   "key":"MY_KEY_HERE",
>   "secret":"your/long/secret/string"
> }
> ```

> To upload the current archive as the "latest" release, use:

> ```
> gulp release
> ```

## Multicluster Setup for Development

To run the UI with multiple clusters, the easiest way is to run 2 nodes out of
the same Elasticsearch directory, but use a different config for each one. One
node will use a "monitoring" config and the other will use a "primary"
config.

View the primary and monitoring config:
```
% cat ../configs/primary-config/elasticsearch.yml
cluster.name: production
xpack.monitoring.agent.exporters.id2:
  type: http
  host: http://127.0.0.1:9210
  auth.username: remote
  auth.password: notsecure

% cat ../configs/monitoring-config/elasticsearch.yml
cluster.name: monitoring
http.port: 9210
```

View the Kibana config:
```
% cat ../configs/kibana-config/kibana.yml
logging:
  # verbose: true
  dest: stdout
server.host: "tsullivan.local"
server:
  ssl:
    key: "/Users/tsullivan/build/server.key"
    cert: "/Users/tsullivan/build/server.crt"
xpack:
  security:
    encryptionKey: "txQiIzu5oOpj1SHajCBTufoeBfOH9wbn"
  monitoring:
    elasticsearch:
      logQueries: true
      url: "http://localhost:9210"
      username: "kibana"
      password: "changeme"
```

Add the Security users:
```
% ./bin/x-pack/users useradd -r monitoring_user -p notsecure monitoring_user
% ./bin/x-pack/users useradd -r remote_monitoring_agent -p notsecure remote
```

Now install the two different Elasticsearch configs:
```
% cp -r config monitoring-config
% cp ../configs/primary-config/elasticsearch.yml ./config/elasticsearch.yml
% cp ../configs/monitoring-config/elasticsearch.yml ./monitoring-config/elasticsearch.yml
```

In one terminal session, start the node for the monitoring cluster:
```
% ./bin/elasticsearch -Epath.conf=monitoring-config
```

In another terminal session, start the node for the primary cluster:
```
% ./bin/elasticsearch
```

Start another Kibana instance connected to the production cluster (simulate load balancing):
```
./bin/kibana --config ../configs/kibana-config/kibana.yml --server.name primary-kibana01 --server.port 5602
```

Start a Kibana instance connected to the Monitoring cluster (for running queries in Sense on Monitoring data):
```
./bin/kibana --config ../configs/kibana-config/kibana.yml --elasticsearch.url http://localhost:9210 --server.name monitoring-kibana --server.port 5611
```
