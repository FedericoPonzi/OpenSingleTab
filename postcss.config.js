// Parcel 2.9's package loader cannot resolve the node: imports used by Tailwind 4.
const nativeRequire = require("module").createRequire(__filename)

module.exports = {
  plugins: [nativeRequire("@tailwindcss/postcss")()]
}
