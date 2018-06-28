const os = require("os")

it("test is only ran on windows", async () => {
    expect(os.platform()).toBe("win32")
})
