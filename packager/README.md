# Kibana X-Pack Packager

This package simply creates an X-Pack build of all the Kibana plugins

## Built Entry

The resulting `index.js` file, the entry point to the Pack, simply requires each of the plugins it builds.

**Each plugin MUST ise `index.js` as its entry file!**

## Built Package

The resulting `package.json` file in the build is controlled by data in the main `package.json`.

To change the resulting version or author, edit the values in the main file.

To change the resulting name, edit `packageName` in the mail file.

# Usage

First `npm install` to get the required modules for creating a build.

The build operation is driven by `npm run` scripts, as follows

script | description
------ | -----------
`build` | For each plugin, resets `node_modules`, executes `npm run build`, collects the output & bundles it into the `build` path
`buildonly` | Same as `build`, *without* resetting the `node_modules`
`package` | Runs the build, compresses the output, saves as tar.gz in `target`
`packageonly` | Same as `package`, *without* running the build first

## Ignoring Plugins

If you'd like to ignore a given, use the `-i` or `--ignore` option, and comma separate multiple plugins.

For example, `npm run build -- -i reporting,shield` would create a build without reporting or shield.