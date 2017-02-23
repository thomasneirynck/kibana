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
 └── x-pack-kibana
```

Simply run `npm start` from within `x-pack-kibana`, and it will bring up Kibana with X-Pack.

#### Alternate: Run the build

If this is not the case, or if you rather lean on Kibana, you'll need to perform a build and start Kibana in dev mode with a custom plugin path.

```
# in x-pack-kibana
npm run build

# in kibana
npm start -- --plugin-path=../path/to/x-pack-kibana/build/kibana/x-pack
```

This is also a useful way to test the build. The downside is that **changes are not automatically synced for you**, so you will need to re-run the build every time you want to use the changes you've made (Kibana will automatically restart when you do, if running in dev mode).

#### Running unit tests_bundle

You can run server-side unit tests by running:

```
npm run test
```

If you want to run tests only for a specific plugin (to save some time), you can run:

```
npm run test -- --plugins <plugin>[,<plugin>]*    # where <plugin> is "reporting", etc.
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
1. Download them by hand [from Bitbucket](https://bitbucket.org/ariya/phantomjs/downloads) and copy them into the `.phantom` path. We're currently using 1.9.8, and you'll need the Window, Mac, and both Linux builds.

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
