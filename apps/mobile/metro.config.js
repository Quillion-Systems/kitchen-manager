// Metro config for a pnpm monorepo.
// See https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require("expo/metro-config")
const path = require("node:path")

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, "../..")

const config = getDefaultConfig(projectRoot)

// 1. Watch the whole monorepo so changes in shared packages are picked up.
config.watchFolders = [workspaceRoot]

// 2. Resolve modules from the app first, then the workspace root (pnpm hoists
//    shared deps to the root .pnpm store; Metro follows the symlinks).
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
]

// 3. SVG imports: route .svg through react-native-svg-transformer so files
//    imported from @kitchen-manager/brand (and anywhere else) become React
//    components wrapping react-native-svg primitives rather than Expo asset
//    bitmaps. svg.d.ts in this app mirrors the types on the TS side.
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer/expo"),
}
config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...config.resolver.sourceExts, "svg"],
}

module.exports = config
