# X-Pack Kibana Features

This folder has the Kibana X-Pack plugin code

### UI Development

The easiest way to develop UI plugins is to use the built-in script to watch for changes and sync them to Kibana, which will also cause Kibana to restart when running in dev mode.

First, you will need the plugin dependencies, get them by running `npm install`.

Once completed, assuming that you have the `x-plugins` repo at the same base path as your `kibana`, it's really simple to get going.

```
$ ls
kibana
x-plugins
```

Simply use `npm start` to watch for and sync changes to Kibana.

#### Alternate: Run the build

If this is not the case, or if you rather lean on Kibana, you'll need to perform a build and start Kibana in dev mode with a custom plugin path.

```
# in x-plugins
npm run build

# in kibana
npm start -- --plugin-path=../path/to/x-plugins/kibana/build/kibana/x-pack
```

This is also a useful way to test the build. The downside is that **changes are not automatically synced for you**, so you will need to re-run the build every time you want to use the changes you've made (Kibana will automatically restart when you do, if running in dev mode).

### Issues starting dev more of creating builds

You may see an error like this when you are getting started:

```
[14:08:15] Error: Linux x86 checksum failed
    at download_phantom.js:42:15
    at process._tickDomainCallback (node.js:407:9)
```

That's thanks to the binary Phantom downloads that have to happen, and Bitbucket being annoying with throttling and redirecting or... something. The real issue eludes me, but you have 2 options to resolve it.

1. Just keep re-running the command until it passes. Eventually the downloads will work, and since they are cached, it won't ever be an issue again.
1. Download them by hand [from Bitbucket](https://bitbucket.org/ariya/phantomjs/downloads) and copy them into the `.phantom` path. We're currently using 1.9.8, and you'll need the Window, Mac, and both Linux builds.

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
    cp ./x-plugins/elasticsearch/x-pack/build/distributions/x-pack-*.zip .
    cp ./elasticsearch/distribution/zip/build/distributions/elasticsearch-*.zip .
    ```
1. Unpack the Elasticsearch build and install the X-Pack plugin

    ```
    unzip elasticsearch-[VERSION].zip
    cd elasticsearch-[VERSION]
    ./bin/elasticsearch-plugin install file:../x-pack-[VERSION].zip
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

You will also need to have the [elasticsearch](https://github.com/elastic/elasticsearch) repo checked out next to the `x-plugins` repo for the build to work, as it pulls the version from a file in that repo. Optinally, if you rather just use the version in `package.json`, pass the `--fallback` flag.

Once complete, use `npm run build`. Output will be placed in the `build` path (it will be created).

To drop the `SNAPSHOT` off the version, use the release flag, `-r` or `--release`

To provide your own custom version, use the version flag, `-v` or `--version`. Note that the version must still matches the major version in the configuration file.

If you'd like to get a zip package and a sha1 checksum file, use `npm run package`. Output will be placed in the `target` path (it will be created). Resulting build output will also be left in the `build` path.

## Releasing X-Pack UI Builds

Make sure you have the dependencies installed by running `npm install`.

Once complete, use `npm run release`. Build and package output will be placed in the `build` and `target` paths respectively (they will be created).

Note that you will need AWS credentials for the upload to succeed. To provide these credentials, create a `~/.aws/credentials` file with your credentials, which should look like this:

```
[default] ; the default profile
aws_access_key_id = ...
aws_secret_access_key = ...

[another-config] ; my "personal-account" profile
aws_access_key_id = ...
aws_secret_access_key = ...
```

The `default` profile is used automatically, but setting the `AWS_PROFILE` environment variable will allow you to use another profile, if you happen to have multiple.

`AWS_PROFILE=another-config npm run release`

See [the AWS docs](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html#Creating_the_Shared_Credentials_File) for more information.
