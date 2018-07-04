const os = require("os")

const { toCygwinPath } = require("./../../index")

describe("toCygwinPath", () => {
    it("resolves simple path correctly", () => {
        const resolvedPath = toCygwinPath("C:\\test")
        expect(resolvedPath).toBe("/cygdrive/c/test")
    })
})

