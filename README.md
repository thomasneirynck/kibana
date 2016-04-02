# XPack Kibana Features

This folder has the Kibana XPack plugin code. For developing and testing the plugins, you must run an instance of Elasticsearch with the XPack plugin installed.

## Elasticsearch and XPack from source

*NOTE: It's way preferable to use ESVM to handle this. The manual steps here are a manual fallback to ESVM.*

1. Set your JAVA_HOME variable (on Mac, you can use `export JAVA_HOME=$(/usr/libexec/java_home)`)
1. Install "gradle" v2.8+ from Homebrew.
1. Create a directory called `es-build` and clone elasticsearch and x-plugins into it.

    ```
    mkdir ~/es-build && cd $_
    git clone git@github.com:elastic/x-plugins.git
    git clone git@github.com:elastic/elasticsearch.git
    ```
   - Now your directory structure looks like:

      ```
      es-build
      ├── elasticsearch
      └── x-plugins
      ```
1. `cd` into each project clone directory and run `gradle assemble` in each
1. Copy the build artifacts into the parent directory

    ```
    cd ~/es-build
    cp ./x-plugins/elasticsearch/x-pack/build/distributions/xpack-*.zip .
    cp ./elasticsearch/distribution/zip/build/distributions/elasticsearch-*.zip .
    ```
1. Unpack the Elasticsearch build and install the XPack plugin

    ```
    unzip elasticsearch-[VERSION].zip
    cd elasticsearch-[VERSION]
    ./bin/elasticsearch-plugin install file:../xpack-[VERSION].zip
    ```
1. Create a Shield user

    ```
    ./bin/x-pack/esusers useradd -r admin -p notsecure admin
    ```
1. Run the Elasticsearch instance, specifying a Unicast host

    ```
    ./bin/elasticsearch -Ddiscovery.zen.ping.unicast.hosts="localhost"
    ```
