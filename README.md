# X-Pack Kibana Features

This folder has the Kibana X-Pack plugin code

### UI Development

First, you will need the plugin dependencies:

```
npm install
```

#### Running in development

Assuming that you have the `x-pack-kibana` repo as a sibling to your `kibana` directory, it's really simple to get going.

```
$ ls $PATH_TO_REPOS
 ├── kibana
 └── elasticsearch (optional)
 └── elasticsearch-extra/x-pack-elasticsearch (optional)
 └── x-pack-kibana
```

Start elasticsearch with x-pack plugins. Follow x-pack-elasticsearch [Setup Instructions](https://github.com/elastic/x-pack-elasticsearch#setup). Execute `gradle run` from within `elasticsearch-extra/x-pack-elasticsearch`.
Seed elasticsearch with some log data by running `node scripts/makelogs --auth elastic:changeme` from within `kibana`.

Simply run `npm start` from within `x-pack-kibana`, and it will bring up Kibana with X-Pack. Default username `elastic` and password `changeme`.

#### Alternate: Run the build

If this is not the case, or if you rather lean on Kibana, you'll need to perform a build and start Kibana in dev mode with a custom plugin path.

```
# in x-pack-kibana
npm run build

# in kibana
npm start -- --plugin-path=../path/to/x-pack-kibana/build/kibana/x-pack
```

This is also a useful way to test the build. The downside is that **changes are not automatically synced for you**, so you will need to re-run the build every time you want to use the changes you've made (Kibana will automatically restart when you do, if running in dev mode).

#### Running server code in debugger

```
# in x-pack-kibana
node --inspect ../kibana/src/cli -c ../kibana/config/kibana.dev.yml --plugin-path ./
```

#### Running unit tests_bundle

You can run unit tests by running:

```
npm run test
```

If you want to run tests only for a specific plugin (to save some time), you can run:

```
npm run test -- --plugins <plugin>[,<plugin>]*    # where <plugin> is "reporting", etc.
```

#### Running tests with flags
```
npm run test -- <flag args>
```

Flags
* `--test-coverage=skip`

#### Running single test file
Edit test file, changing top level `describe` to `describe.only`. Run tests with normal commands.

#### Running server unit tests
You can run server-side unit tests by running:

```
npm run test:server
```

#### Running functional tests

The functional tests are run against a live browser, Kibana, and Elasticsearch install. They build their own version of elasticsearch and x-pack-elasticsearch, run the builds automatically, startup the kibana server, and run the tests against them.

To do all of this in a single command run:

```sh
node scripts/functional_tests
```

If you are **developing functional tests** then you probably don't want to rebuild elasticsearch and wait for all that setup on every test run, so instead use this command to get started:

```sh
node scripts/functional_tests_server
```

After all of the setup is running open a new terminal and run this command to just run the tests (without tearing down Elasticsearch, Kibana, etc.)

```sh
# make sure you are in the x-pack-kibana project
cd x-pack-kibana

# this command accepts a bunch of arguments to tweak the run, try sending --help to learn more
node ../kibana/scripts/functional_test_runner
```

### Issues starting dev more of creating builds

You may see an error like this when you are getting started:

```
[14:08:15] Error: Linux x86 checksum failed
    at download_phantom.js:42:15
    at process._tickDomainCallback (node.js:407:9)
```

That's thanks to the binary Phantom downloads that have to happen, and Bitbucket being annoying with throttling and redirecting or... something. The real issue eludes me, but you have 2 options to resolve it.

1. Just keep re-running the command until it passes. Eventually the downloads will work, and since they are cached, it won't ever be an issue again.
1. Download them by hand [from Bitbucket](https://bitbucket.org/ariya/phantomjs/downloads) and copy them into the `.phantom` path. We're currently using 1.9.8, and you'll need the Window, Mac, and Linux builds.

## Building and Packaging

Make sure you have the dependencies installed by running `npm install`.

Once complete, use `npm run build`. Output will be placed in the `build` path (it will be created).

To drop the `SNAPSHOT` off the version, use the release flag, `-r` or `--release`

If you'd like to get a zip package and a sha1 checksum file, use `npm run package`. Output will be placed in the `target` path (it will be created). Resulting build output will also be left in the `build` path.

## Releasing

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

# Building documentation

This repo is used to build the Kibana User Guide. In particular, it builds a
version of the guide that includes X-Pack-specific information in 5.5 and later.

To build the Kibana User Guide on your local machine:

- Use the `index.asciidoc` file in the docs/en folder.
- Specify the location of the `kibana/docs/` directory with the `--resource` option when you run `build_docs.pl`.
- Specify the location of the `elasticsearch-extra/x-pack-elasticsearch/docs/en` directory with the `--resource` option,
since some of the monitoring settings re-use SSL information from that repository

For example:

```
docs/build_docs.pl --doc x-pack-kibana/docs/en/index.asciidoc --resource=kibana/docs/ --chunk 1 --resource=elasticsearch-extra/x-pack-elasticsearch/docs/en
```

To build a release notes page for the pull requests in this repository:

- Use the dev-tools/xkb-release-notes.pl script.
- Specify the version label for which you want the release notes.
- Redirect the output to a new local file.

Note: You must have a personal access token called ~/.github_auth with "repo" scope.

For example:

```
./dev-tools/xkb_release_notes.pl v5.5.2 > ~/tmp/5.5.2.asciidoc
```
