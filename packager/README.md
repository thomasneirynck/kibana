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
`justbuild` | Same as `build`, *without* resetting the `node_modules`

