const assert = require("node:assert/strict")
const { readFileSync } = require("node:fs")
const { test } = require("node:test")
const { runInNewContext } = require("node:vm")

const source = readFileSync(
  new URL("../src/background.ts", `file://${__filename}`),
  "utf8"
)

function setup({ displayOnStartup = false, tabs = [], queryError } = {}) {
  const calls = []
  const listeners = {}
  const chrome = {
    runtime: {
      getURL: (path) => `chrome-extension://test/${path}`,
      onInstalled: { addListener: (fn) => (listeners.installed = fn) },
      onStartup: { addListener: (fn) => (listeners.startup = fn) }
    },
    storage: {
      local: {
        get: (defaults, callback) => {
          assert.equal(defaults.displayOnStartup, false)
          callback({ displayOnStartup })
        }
      }
    },
    tabs: {
      query: async ({ url }) => {
        calls.push(["query", url])
        if (queryError) throw queryError
        return tabs
      },
      create: async ({ url }) => calls.push(["create", url]),
      update: async (id, { active }) => calls.push(["activate", id, active])
    },
    windows: {
      update: async (id, { focused }) => calls.push(["focus", id, focused])
    }
  }
  runInNewContext(source, {
    chrome,
    console: { error: (...args) => calls.push(["error", ...args]) }
  })
  return {
    calls,
    async trigger(event) {
      listeners[event]()
      await new Promise(setImmediate)
    }
  }
}

for (const event of ["installed", "startup"]) {
  test(`${event} does not open a tab when startup display is disabled`, async () => {
    const app = setup()
    await app.trigger(event)
    assert.deepEqual(app.calls, [])
  })
}

test("startup opens the display page when enabled and no tab exists", async () => {
  const app = setup({ displayOnStartup: true })
  await app.trigger("startup")
  assert.deepEqual(app.calls, [
    ["query", "chrome-extension://test/tabs/display.html"],
    ["create", "chrome-extension://test/tabs/display.html"]
  ])
})

test("installation focuses an existing display tab instead of duplicating it", async () => {
  const app = setup({
    displayOnStartup: true,
    tabs: [{ id: 5, windowId: 8 }]
  })
  await app.trigger("installed")
  assert.deepEqual(app.calls, [
    ["query", "chrome-extension://test/tabs/display.html"],
    ["activate", 5, true],
    ["focus", 8, true]
  ])
})

test("query failures are reported without creating a duplicate tab", async () => {
  const error = new Error("Tabs unavailable")
  const app = setup({ displayOnStartup: true, queryError: error })
  await app.trigger("startup")
  assert.deepEqual(app.calls, [
    ["query", "chrome-extension://test/tabs/display.html"],
    ["error", "Error opening display page:", error]
  ])
})
