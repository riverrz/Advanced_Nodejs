const puppeteer = require("puppeteer");

let browser, page;

// before each test
beforeEach(async () => {
  jest.setTimeout(10000);
  browser = await puppeteer.launch({
    headless: false
  });
  page = await browser.newPage();
  await page.goto("localhost:3000");
});

afterEach(async () => {
  await browser.close();
});

test("the header has correct text", async () => {
  const text = await page.$eval("a.brand-logo", el => el.innerHTML);
  expect(text).toEqual("Blogster");
});

test("clicking login starts oauth flow", async () => {
  await page.click(".right a");
  const url = await page.url();
  expect(url).toMatch(/accounts\.google\.com/);
});

test.only("when signed in shows logout", async () => {
  const id = "5b82e7f3ad3d8f21072cd9a3";
  const Buffer = require("safe-buffer").Buffer;
  const sessionObject = {
    passport: {
      user: id
    }
  };
  const sessionString = Buffer.from(JSON.stringify(sessionObject)).toString(
    "base64"
  );
  const Keygrip = require("keygrip");
  const keys = require("../config/keys");
  const keygrip = new Keygrip([keys.cookieKey]);
  const sig = keygrip.sign("session=" + sessionString);

  await page.setCookie({ name: "session", value: sessionString });
  await page.setCookie({ name: "session.sig", value: sig });
  await page.goto("localhost:3000"); // to refresh the page so cookies are in headers for new requests
  await page.waitFor('a[href="/auth/logout"]');

  const text = await page.$eval('a[href="/auth/logout"]', el => el.innerHTML);

  expect(text).toEqual("Logout");
});
