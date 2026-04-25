const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);
const nativeWindConfig = withNativeWind(config, { input: './global.css' });

// Metro on Windows/Expo 54 cannot resolve formik's `main` field ("dist/index.js")
// because it treats the .js suffix as part of the base name and then tries to
// append platform extensions (e.g. dist/index.js.js), never finding the actual file.
// We bypass that by pointing Metro directly at the CJS build file.
const existingResolveRequest = nativeWindConfig.resolver?.resolveRequest;
nativeWindConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'formik') {
    const cjsFile =
      process.env.NODE_ENV === 'production'
        ? 'formik.cjs.production.min.js'
        : 'formik.cjs.development.js';
    return {
      filePath: path.resolve(__dirname, 'node_modules', 'formik', 'dist', cjsFile),
      type: 'sourceFile',
    };
  }
  if (existingResolveRequest) {
    return existingResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = nativeWindConfig;
