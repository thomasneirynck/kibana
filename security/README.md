# Kibana Shield Plugin

1. Install the Shield plugin on Kibana `bin/kibana plugin --install kibana/shield/latest`
1. Modify [kibana.yml](https://github.com/elastic/kibana/blob/master/config/kibana.yml) and add `xpack.shield.encryptionKey: "something_secret"`
1. Make sure that the following config options are also set: `elasticsearch.username`, `elasticsearch.password`, `server.ssl.cert`, and `server.ssl.key` (see [Configuring Kibana to Work with Shield](https://www.elastic.co/guide/en/kibana/current/production.html#configuring-kibana-shield))

Once done, open up the following url (assuming standard kibana config): [https://localhost:5601](https://localhost:5601).
