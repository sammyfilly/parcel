// @flow

import {Resolver} from '@parcel/plugin';
import NodeResolver from '@parcel/node-resolver-core';

// Throw user friendly errors on special webpack loader syntax
// ex. `imports-loader?$=jquery!./example.js`
const WEBPACK_IMPORT_REGEX = /\S+-loader\S*!\S+/g;

export default (new Resolver({
  resolve({dependency, options, specifier}) {
    if (WEBPACK_IMPORT_REGEX.test(dependency.specifier)) {
      throw new Error(
        `The import path: ${dependency.specifier} is using webpack specific loader import syntax, which isn't supported by Parcel.`,
      );
    }

    // ATLASSIAN: always prefer `module` over `main` so we can resolve esm versions of atlaskit modules
    let mainFields = ['source', 'browser', 'module', 'main'];
    const resolver = new NodeResolver({
      extensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'css', 'styl'],
      fs: options.inputFS,
      mainFields,
      projectRoot: options.projectRoot,
      // ATLASSIAN: use custom field in package.json for aliases so we can have different aliases for SSR and client builds
      aliasField: 'aliasSsr',
    });

    return resolver.resolve({
      filename: specifier,
      specifierType: dependency.specifierType,
      parent: dependency.sourcePath,
      env: dependency.env,
    });
  },
}): Resolver);
