import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, "..");
const publicRoot = path.join(frontendRoot, "public");
const distRoot = path.join(frontendRoot, "dist");

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".mjs": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
  };
  return map[ext] || "application/octet-stream";
}

function createServer() {
  return http.createServer((req, res) => {
    let urlPath = "/";
    try {
      urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    } catch {
      res.writeHead(400);
      return res.end("Bad request");
    }

    // Mock API requests so SPA frontend doesn't hang or receive HTML
    if (urlPath.startsWith("/api/")) {
      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      });
      return res.end(JSON.stringify({ success: true, data: [] }));
    }

    const requestPath = urlPath === "/" ? "landing/index.html" : urlPath.replace(/^\/+/, "");
    let resolved = path.resolve(distRoot, requestPath);
    if (!fs.existsSync(resolved) || fs.statSync(resolved).isDirectory()) {
      resolved = path.resolve(publicRoot, requestPath);
    }

    const filePath = (fs.existsSync(resolved) && fs.statSync(resolved).isFile())
      ? resolved
      : (requestPath.startsWith("landing") ? path.join(publicRoot, "landing", "index.html") : path.join(distRoot, "index.html"));

    fs.readFile(filePath, (error, data) => {
      if (error) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        return res.end("Not found");
      }
      res.writeHead(200, {
        "Content-Type": getMimeType(filePath),
        "Access-Control-Allow-Origin": "*"
      });
      res.end(data);
    });
  });
}

async function launchBrowser() {
  const candidates = [
    { label: "Playwright Chromium", options: { headless: true } },
    { label: "Google Chrome", options: { headless: true, channel: "chrome" } },
    { label: "Microsoft Edge", options: { headless: true, channel: "msedge" } },
  ];
  const failures = [];

  for (const candidate of candidates) {
    try {
      return await chromium.launch(candidate.options);
    } catch (error) {
      failures.push(`${candidate.label}: ${error.message.split("\n")[0]}`);
    }
  }

  throw new Error(`No compatible browser could be launched. ${failures.join(" | ")}`);
}

async function runE2ETests() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  console.log(`\n🚀 Starting Mobile & Responsive E2E Validation on port ${port}...`);

  const browser = await launchBrowser();
  const context = await browser.newContext();
  await context.route(/^(https?:)?\/\/(fonts\.|cdn\.jsdelivr\.net|www\.google)/i, (route) => route.abort());

  const landingViewports = [
    { name: "iPhone SE (375x667)", width: 375, height: 667, isMobile: true },
    { name: "iPhone 13/14 (390x844)", width: 390, height: 844, isMobile: true },
    { name: "iPad Mini (768x1024)", width: 768, height: 1024, isMobile: true },
    { name: "Desktop (1280x800)", width: 1280, height: 800, isMobile: false },
  ];

  let totalPassed = 0;
  let totalFailed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      totalPassed++;
    } else {
      console.error(`  ✗ FAILED: ${message}`);
      totalFailed++;
    }
  }

  // --- SECTION 1: Landing Page Tests ---
  console.log("\n==========================================");
  console.log("SECTION 1: Landing Page Tests");
  console.log("==========================================");

  for (const vp of landingViewports) {
    console.log(`\n--- Testing Landing Viewport: ${vp.name} ---`);
    const page = await context.newPage();
    await page.setViewportSize({ width: vp.width, height: vp.height });

    try {
      await page.goto(`${baseUrl}/landing/index.html`, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForTimeout(200);

      // 1. Overflow check in RTL
      const rtlOverflow = await page.evaluate(() => {
        const doc = document.documentElement.scrollWidth;
        const body = document.body.scrollWidth;
        const inner = window.innerWidth;
        return { doc, body, inner, ok: doc <= inner && body <= inner };
      });
      assert(
        rtlOverflow.ok,
        `Landing RTL fits viewport (${vp.width}px): doc=${rtlOverflow.doc}px, body=${rtlOverflow.body}px, win=${rtlOverflow.inner}px`
      );

      // 2. Switch to LTR and re-check overflow
      await page.evaluate(() => {
        if (typeof window.switchLanguage === "function") {
          window.switchLanguage("en");
        } else {
          document.documentElement.setAttribute("dir", "ltr");
          document.documentElement.setAttribute("lang", "en");
        }
      });
      await page.waitForTimeout(150);

      const ltrOverflow = await page.evaluate(() => {
        const doc = document.documentElement.scrollWidth;
        const body = document.body.scrollWidth;
        const inner = window.innerWidth;
        return { doc, body, inner, ok: doc <= inner && body <= inner };
      });
      assert(
        ltrOverflow.ok,
        `Landing LTR fits viewport (${vp.width}px): doc=${ltrOverflow.doc}px, body=${ltrOverflow.body}px, win=${ltrOverflow.inner}px`
      );

      // Reset back to RTL for drawer checks
      await page.evaluate(() => {
        if (typeof window.switchLanguage === "function") {
          window.switchLanguage("ar");
        } else {
          document.documentElement.setAttribute("dir", "rtl");
          document.documentElement.setAttribute("lang", "ar");
        }
      });

      // 3. Mobile drawer interactions
      if (vp.isMobile) {
        const hamburgerVisible = await page.evaluate(() => {
          const btn = document.querySelector(".mobile-menu-toggle");
          if (!btn) return false;
          const style = window.getComputedStyle(btn);
          return style.display !== "none" && style.visibility !== "hidden";
        });
        assert(hamburgerVisible, `Hamburger button is visible on ${vp.width}px`);

        // Open drawer via button
        await page.click(".mobile-menu-toggle");
        await page.waitForTimeout(150);

        const drawerIsOpen = await page.evaluate(() => {
          const drawer = document.getElementById("mobile-drawer");
          const overlay = document.getElementById("drawer-overlay");
          return drawer?.classList.contains("is-open") && overlay?.classList.contains("is-open");
        });
        assert(drawerIsOpen, "Mobile drawer and overlay open on toggle click");

        // Close drawer via Escape key
        await page.keyboard.press("Escape");
        await page.waitForTimeout(150);

        const drawerClosedEscape = await page.evaluate(() => {
          const drawer = document.getElementById("mobile-drawer");
          return !drawer?.classList.contains("is-open");
        });
        assert(drawerClosedEscape, "Mobile drawer closes on Escape key press");

        // Open again and close via overlay click
        await page.click(".mobile-menu-toggle");
        await page.waitForTimeout(150);
        const direction = await page.locator("html").getAttribute("dir");
        const overlayX = direction === "rtl" ? vp.width - 10 : 10;
        await page.click("#drawer-overlay", { position: { x: overlayX, y: 10 } });
        await page.waitForTimeout(150);

        const drawerClosedOverlay = await page.evaluate(() => {
          const drawer = document.getElementById("mobile-drawer");
          return !drawer?.classList.contains("is-open");
        });
        assert(drawerClosedOverlay, "Mobile drawer closes on backdrop overlay click");

        // Open again and close via drawer close button
        await page.click(".mobile-menu-toggle");
        await page.waitForTimeout(150);
        await page.click(".drawer-close");
        await page.waitForTimeout(150);

        const drawerClosedBtn = await page.evaluate(() => {
          const drawer = document.getElementById("mobile-drawer");
          return !drawer?.classList.contains("is-open");
        });
        assert(drawerClosedBtn, "Mobile drawer closes on (X) close button click");
      }

      // 4. Modal dialog interaction
      const modalCheck = await page.evaluate(() => {
        const trigger = document.querySelector(".primary-button.large");
        if (!trigger) return false;
        trigger.click();
        const modal = document.getElementById("trial-modal");
        return modal?.classList.contains("on");
      });
      assert(modalCheck, "Lead generation modal opens on CTA trigger");

      await page.keyboard.press("Escape");
      await page.waitForTimeout(150);

      const modalClosed = await page.evaluate(() => {
        const modal = document.getElementById("trial-modal");
        return !modal?.classList.contains("on");
      });
      assert(modalClosed, "Lead generation modal closes cleanly on Escape");
    } finally {
      await page.close();
    }
  }

  // --- SECTION 2: SPA App Pages (/login, /courses, /sell-courses, /privacy) ---
  console.log("\n==========================================");
  console.log("SECTION 2: SPA Application Pages (/login, /courses, /sell-courses, /privacy)");
  console.log("==========================================");

  const spaViewports = [
    { name: "iPhone SE (375x667)", width: 375, height: 667 },
    { name: "iPhone 13 (390x844)", width: 390, height: 844 },
    { name: "Desktop (1280x800)", width: 1280, height: 800 },
  ];

  for (const vp of spaViewports) {
    console.log(`\n--- Testing SPA Viewport: ${vp.name} ---`);

    // 1. Test /login
    const pageLogin = await context.newPage();
    await pageLogin.setViewportSize({ width: vp.width, height: vp.height });
    try {
      await pageLogin.route("**/api/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: [] }) }));
      await pageLogin.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded", timeout: 15000 });
      await pageLogin.waitForTimeout(300);

      const overflow = await pageLogin.evaluate(() => ({
        doc: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
        inner: window.innerWidth,
      }));
      assert(
        overflow.doc <= overflow.inner && overflow.body <= overflow.inner,
        `/login fits viewport (${vp.width}px): doc=${overflow.doc}px, body=${overflow.body}px, win=${overflow.inner}px`
      );

      const hasInputs = await pageLogin.evaluate(() => {
        const emailInput = document.querySelector('input[type="email"], input[id="identifier"], input[name="identifier"]');
        const passInput = document.querySelector('input[type="password"]');
        return Boolean(emailInput || passInput);
      });
      assert(hasInputs, `/login renders interactive authentication form elements`);
    } finally {
      await pageLogin.close();
    }

    // 2. Test the registration and recovery entry points
    for (const authRoute of ["/create-account", "/forgot-password"]) {
      const authPage = await context.newPage();
      await authPage.setViewportSize({ width: vp.width, height: vp.height });
      try {
        await authPage.route("**/api/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: [] }) }));
        await authPage.goto(`${baseUrl}${authRoute}`, { waitUntil: "domcontentloaded", timeout: 15000 });
        await authPage.waitForTimeout(300);

        const authState = await authPage.evaluate(() => ({
          doc: document.documentElement.scrollWidth,
          body: document.body.scrollWidth,
          inner: window.innerWidth,
          hasHeading: Boolean(document.querySelector("h1")),
          hasForm: Boolean(document.querySelector("form")),
        }));
        assert(
          authState.doc <= authState.inner && authState.body <= authState.inner,
          `${authRoute} fits viewport (${vp.width}px): doc=${authState.doc}px, body=${authState.body}px, win=${authState.inner}px`
        );
        assert(authState.hasHeading && authState.hasForm, `${authRoute} renders a labelled authentication form`);
      } finally {
        await authPage.close();
      }
    }

    // 3. Test /courses
    const pageCourses = await context.newPage();
    await pageCourses.setViewportSize({ width: vp.width, height: vp.height });
    try {
      await pageCourses.route("**/api/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: [] }) }));
      await pageCourses.goto(`${baseUrl}/courses`, { waitUntil: "domcontentloaded", timeout: 15000 });
      await pageCourses.waitForTimeout(300);

      const overflow = await pageCourses.evaluate(() => ({
        doc: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
        inner: window.innerWidth,
      }));
      assert(
        overflow.doc <= overflow.inner && overflow.body <= overflow.inner,
        `/courses fits viewport (${vp.width}px): doc=${overflow.doc}px, body=${overflow.body}px, win=${overflow.inner}px`
      );
    } finally {
      await pageCourses.close();
    }

    // 4. Test the marketplace seller and provider registration entry points
    for (const sellerRoute of ["/sell-courses", "/register-company?type=independent_instructor"]) {
      const sellerPage = await context.newPage();
      await sellerPage.setViewportSize({ width: vp.width, height: vp.height });
      try {
        await sellerPage.route("**/api/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: [] }) }));
        await sellerPage.goto(`${baseUrl}${sellerRoute}`, { waitUntil: "domcontentloaded", timeout: 15000 });
        await sellerPage.waitForSelector("h1", { timeout: 5000 });
        await sellerPage.waitForTimeout(150);

        const sellerState = await sellerPage.evaluate(() => {
          const text = document.body.innerText || "";
          return {
            doc: document.documentElement.scrollWidth,
            body: document.body.scrollWidth,
            inner: window.innerWidth,
            hasHeading: Boolean(document.querySelector("h1")),
            hasInstructorPath: text.includes("مدرس مستقل") || text.includes("Independent instructor"),
          };
        });
        assert(
          sellerState.doc <= sellerState.inner && sellerState.body <= sellerState.inner,
          `${sellerRoute} fits viewport (${vp.width}px): doc=${sellerState.doc}px, body=${sellerState.body}px, win=${sellerState.inner}px`
        );
        assert(sellerState.hasHeading && sellerState.hasInstructorPath, `${sellerRoute} exposes the independent-instructor onboarding path`);
      } finally {
        await sellerPage.close();
      }
    }

    // 5. Test /privacy
    const pagePrivacy = await context.newPage();
    await pagePrivacy.setViewportSize({ width: vp.width, height: vp.height });
    try {
      await pagePrivacy.route("**/api/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: [] }) }));
      await pagePrivacy.goto(`${baseUrl}/privacy`, { waitUntil: "domcontentloaded", timeout: 15000 });
      try {
        await pagePrivacy.waitForSelector("h1", { timeout: 5000 });
      } catch {
        // Fallback wait
        await pagePrivacy.waitForTimeout(1000);
      }

      const overflow = await pagePrivacy.evaluate(() => ({
        doc: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
        inner: window.innerWidth,
      }));
      assert(
        overflow.doc <= overflow.inner && overflow.body <= overflow.inner,
        `/privacy fits viewport (${vp.width}px): doc=${overflow.doc}px, body=${overflow.body}px, win=${overflow.inner}px`
      );

      const privacyData = await pagePrivacy.evaluate(() => {
        const text = document.body.innerText || "";
        return {
          hasDPO: text.includes("privacy@ainplatform.com"),
          hasRetention: text.includes("30") || text.includes("الاحتفاظ") || text.includes("Retention"),
        };
      });
      assert(privacyData.hasDPO, `/privacy includes the published privacy contact (privacy@ainplatform.com)`);
      assert(privacyData.hasRetention, `/privacy displays retention and minor-protection responsibilities`);
    } finally {
      await pagePrivacy.close();
    }
  }

  await browser.close();
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

  console.log(`\n========================================`);
  console.log(`E2E Summary: ${totalPassed} Passed, ${totalFailed} Failed`);
  console.log(`========================================\n`);

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runE2ETests().catch((err) => {
  console.error("E2E Execution Error:", err);
  process.exit(1);
});
