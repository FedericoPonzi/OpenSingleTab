const assert = require("node:assert/strict")
const { execFileSync } = require("node:child_process")
const { mkdtempSync, readFileSync, rmSync } = require("node:fs")
const { tmpdir } = require("node:os")
const path = require("node:path")
const { test } = require("node:test")
const { runInNewContext } = require("node:vm")

test("loading saved options updates all settings without throwing", (t) => {
  const output = mkdtempSync(path.join(tmpdir(), "open-single-tab-test-"))
  t.after(() => rmSync(output, { recursive: true, force: true }))
  execFileSync(
    path.join(__dirname, "../node_modules/.bin/tsc"),
    [
      "--ignoreConfig",
      "--noCheck",
      "--noResolve",
      "--jsx",
      "react-jsx",
      "--module",
      "commonjs",
      "--outDir",
      output,
      path.join(__dirname, "../src/options.tsx")
    ],
    { stdio: "pipe" }
  )

  const states = []
  const effects = []
  const saved = {
    keepTabsOpen: true,
    displayOnStartup: true,
    allowDuplicates: false,
    includePinnedTabs: false,
    windowRestoreMode: "smart"
  }
  const exports = {}
  runInNewContext(readFileSync(path.join(output, "options.js"), "utf8"), {
    exports,
    require(name) {
      if (name === "react") {
        return {
          useState(initial) {
            const index = states.push(initial) - 1
            return [initial, (value) => (states[index] = value)]
          },
          useEffect: (effect) => effects.push(effect)
        }
      }
      if (name === "react/jsx-runtime") return require(name)
      if (name === "./style.css") return {}
      if (name === "./components/Footer") return () => null
      throw new Error(`Unexpected import: ${name}`)
    },
    chrome: {
      storage: {
        local: {
          get: (defaults, callback) => callback({ ...defaults, ...saved })
        }
      }
    }
  })

  exports.default()
  for (const effect of effects) effect()
  assert.deepEqual(states, [true, true, false, false, "smart"])
})
