# X-Pack Kibana Features

This folder has the Kibana X-Pack plugin code

### UI Development

The easiest way to develop UI plugins is to use the built-in script to watch for changes and sync back to Kibana.

First, you will need the plugin dependencies, get them by running `npm install`.

Once you completed, assuming that you have the `x-plugins` repo at the same base path as your `kibana`, it's really simple to get going.

```
$ ls
kibana
x-plugins
```

Simply use `npm start` to watch for and sync changes to Kibana.

#### Alternate: Run the build

If this is not the case, of if you rather lean on Kibana, you'll need to perform a build and start Kibana in dev mode with a custom plugin path.

```
# in x-plugins
npm run build

# in kibana
npm start -- --plugin-path=../path/to/x-plugins/kibana/build/kibana/x-pack
```

This is also a useful way to test the build. The downside is that **changes are not automatically synced for you**, so you will need to re-run the build every time you want to use the changes you've made (Kibana will automatically restart when you do).

### Elasticsearch and X-Pack from source

For developing and testing the plugins, you must run an instance of Elasticsearch with the X-Pack plugin installed.

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
1. Unpack the Elasticsearch build and install the X-Pack plugin

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

## Building and Packages the X-Pack UI plugins

Make sure you have the dependencies installed by running `npm install`.

Once complete, use `npm run build`. Output will be placed in the `build` path (it will be created).

If you'd like to get a zip package and a sha1 checksum file, use `npm run package`. Output will be placed in the `target` path (it will be created). Resulting build output will also be left in the `build` path.