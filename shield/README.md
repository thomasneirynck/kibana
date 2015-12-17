# Kibana Shield Plugin

- Modify [kibana.yml](https://github.com/elastic/kibana/blob/master/config/kibana.yml) and add `shield.encryptionKey: "my_encryption_key"`
- Install the Shield plugin on kibana `bin/kibana plugin --install kibana/shield/0.2.0-SNAPSHOT`

Once done, open up the following url (assuming standard kibana config): [http://localhost:5601](http://localhost:5601).
