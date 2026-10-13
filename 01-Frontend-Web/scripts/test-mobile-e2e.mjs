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
const courseSummaryFixture = {
  id: "course-regression-1",
  organizationId: "organization-regression-1",
  slug: "regression-course",
  title: "Regression Course",
  titleAr: "كورس اختبار التفاصيل",
  shortDescription: "Course summary without detailed array fields.",
  shortDescriptionAr: "ملخص كورس بدون حقول التفاصيل.",
  educationLevel: "beginner",
  deliveryType: "online",
  priceMinor: 150000,
  currency: "EGP",
  status: "published",
  academy: { id: "academy-regression-1", name: "AIN Academy", nameAr: "أكاديمية عين", verified: true },
  instructor: { id: "instructor-regression-1", name: "Nour Samir", nameAr: "نور سمير" },
  category: { id: "category-regression-1", name: "Technology", nameAr: "التكنولوجيا" },
  batches: [{
    id: "batch-regression-1",
    title: "November Cohort",
    titleAr: "دفعة نوفمبر",
    startDate: "2026-11-01T00:00:00Z",
    schedule: [{ day: "Monday", time: "19:00" }],
    deliveryType: "online",
    capacity: 20,
    remainingSeats: 8,
    location: "Online",
    status: "open"
  }]
};

function marketplaceFixtureFor(url) {
  const pathName = new URL(url).pathname;
  if (pathName.endsWith("/public/courses/course-regression-1")) {
    return {
      ...courseSummaryFixture,
      description: "Detailed course description.",
      descriptionAr: "وصف الكورس الكامل.",
      learningOutcomes: ["Build a complete project"],
      requirements: [],
      duration: "4 weeks",
      sessionsCount: 8
    };
  }
  if (pathName.endsWith("/public/courses")) return [courseSummaryFixture];
  if (pathName.endsWith("/public/academies")) {
    return [{
      id: "academy-regression-1",
      organizationId: "organization-regression-1",
      slug: "ain-academy",
      publicName: "AIN Academy",
      publicNameAr: "أكاديمية عين",
      verificationStatus: "verified",
      isPublic: true,
      deliveryMethods: ["online"]
    }];
  }
  if (pathName.endsWith("/public/categories")) {
    return [{ id: "category-regression-1", name: "Technology", nameAr: "التكنولوجيا", active: true }];
  }
  return [];
}

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

  async function reportHorizontalOverflow(page, label) {
    const offenders = await page.evaluate(() => [...document.body.querySelectorAll("*")]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          selector: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${element.classList.length ? `.${[...element.classList].join(".")}` : ""}`,
          left: Math.round(rect.left * 100) / 100,
          right: Math.round(rect.right * 100) / 100,
          width: Math.round(rect.width * 100) / 100,
        };
      })
      .filter(({ left, right }) => left < -0.5 || right > window.innerWidth + 0.5)
      .slice(0, 12));

    console.error(`  Horizontal overflow diagnostics (${label}): ${JSON.stringify(offenders)}`);
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

      const contextMenuBlocked = await page.evaluate(() => {
        const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
        document.body.dispatchEvent(event);
        return event.defaultPrevented;
      });
      assert(contextMenuBlocked, `Landing context menu is blocked on ${vp.width}px`);

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
      if (!rtlOverflow.ok) {
        await reportHorizontalOverflow(page, `RTL ${vp.width}px`);
      }

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
      if (!ltrOverflow.ok) {
        await reportHorizontalOverflow(page, `LTR ${vp.width}px`);
      }

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

        const cardRails = await page.evaluate(() => {
          const selectors = [
            ".banner-grid",
            ".trust-foundation-grid",
            ".comparison-grid",
            ".features-grid",
            ".testimonials-grid",
            ".steps-flow",
            ".pricing-cards-grid",
            ".market-launch-options",
          ];

          return selectors.map((selector) => {
            const element = document.querySelector(selector);
            const style = element ? window.getComputedStyle(element) : null;
            return {
              selector,
              exists: Boolean(element),
              display: style?.display,
              overflowX: style?.overflowX,
              hasHorizontalContent: Boolean(element && element.scrollWidth > element.clientWidth),
              clientWidth: element?.clientWidth,
              scrollWidth: element?.scrollWidth,
              childWidths: element
                ? [...element.children].map((child) => Math.round(child.getBoundingClientRect().width))
                : [],
            };
          });
        });

        const cardRailsAreValid = cardRails.every(({
          exists,
          display,
          overflowX,
          hasHorizontalContent,
        }) => (
          exists
          && display === "flex"
          && overflowX === "auto"
          && (vp.width > 600 || hasHorizontalContent)
        ));
        if (!cardRailsAreValid) {
          console.error(`  Landing rail diagnostics: ${JSON.stringify(cardRails)}`);
        }
        assert(
          cardRailsAreValid,
          `Landing card groups are compact horizontal swipe rails on ${vp.width}px`
        );
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

      await page.evaluate(() => {
        window.__capturedWhatsAppUrl = "";
        window.open = (url) => {
          window.__capturedWhatsAppUrl = String(url);
          return null;
        };
        window.openLeadModal("trial-modal");
      });
      await page.locator('#trial-modal input[name="name"]').fill("محمد فوزي");
      await page.locator('#trial-modal input[name="phone"]').fill("01001942600");
      await page.locator('#trial-modal input[name="email"]').fill("mohamed@example.com");
      await page.locator('#trial-modal input[name="organization"]').fill("أكاديمية المركز");
      await page.locator('#trial-modal select[name="type"]').selectOption({ index: 1 });
      await page.locator('#trial-modal select[name="students"]').selectOption({ index: 1 });
      await page.locator('#trial-modal textarea[name="content"]').fill("كورس برمجة ومذكرات");
      await page.locator("#trial-modal form.lead-form").evaluate((form) => form.requestSubmit());
      await page.waitForTimeout(250);

      const whatsAppMessage = await page.evaluate(() => {
        const url = new URL(window.__capturedWhatsAppUrl);
        return url.searchParams.get("text") || "";
      });
      assert(
        whatsAppMessage.includes("الاسم: محمد فوزي")
          && whatsAppMessage.includes("اسم الأكاديمية / المركز: أكاديمية المركز"),
        "WhatsApp trial message preserves Arabic fields"
      );
      assert(
        !whatsAppMessage.includes("\uFFFD") && !/[\u{1F300}-\u{1FAFF}]/u.test(whatsAppMessage),
        "WhatsApp trial message excludes corrupted emoji separators"
      );
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

      const appContextMenuBlocked = await pageLogin.evaluate(() => {
        const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
        document.body.dispatchEvent(event);
        return event.defaultPrevented;
      });
      assert(appContextMenuBlocked, `/login blocks the page context menu outside form fields`);

      const formContextMenuAllowed = await pageLogin.evaluate(() => {
        const input = document.querySelector("input");
        if (!input) return false;
        const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
        input.dispatchEvent(event);
        return !event.defaultPrevented;
      });
      assert(formContextMenuAllowed, `/login keeps context actions available inside form fields`);
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
      await pageCourses.waitForSelector(".market-course-grid", { timeout: 5000 });

      const overflow = await pageCourses.evaluate(() => {
        const courseGrid = document.querySelector(".market-course-grid");
        return {
          doc: document.documentElement.scrollWidth,
          body: document.body.scrollWidth,
          inner: window.innerWidth,
          courseRail: Boolean(courseGrid && (() => {
            const style = window.getComputedStyle(courseGrid);
            const isConfigured = style.display === "flex" && ["auto", "scroll"].includes(style.overflowX);
            const hasHorizontalRange = courseGrid.children.length <= 1 || courseGrid.scrollWidth > courseGrid.clientWidth;
            return isConfigured && hasHorizontalRange;
          })())
        };
      });
      assert(
        overflow.doc <= overflow.inner && overflow.body <= overflow.inner,
        `/courses fits viewport (${vp.width}px): doc=${overflow.doc}px, body=${overflow.body}px, win=${overflow.inner}px`
      );
      if (vp.width < 760) {
        assert(overflow.courseRail, `/courses cards use a horizontal swipe rail on ${vp.width}px`);
      }
    } finally {
      await pageCourses.close();
    }

    // 4. Regress the public course detail crash caused by missing summary arrays.
    const courseDetailsPage = await context.newPage();
    await courseDetailsPage.setViewportSize({ width: vp.width, height: vp.height });
    const coursePageErrors = [];
    courseDetailsPage.on("pageerror", (error) => coursePageErrors.push(error.message));
    try {
      await courseDetailsPage.route("**/api/**", (route) => route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: marketplaceFixtureFor(route.request().url()) })
      }));
      await courseDetailsPage.goto(`${baseUrl}/courses/regression-course`, { waitUntil: "domcontentloaded", timeout: 15000 });
      await courseDetailsPage.waitForSelector(".course-detail-main h1", { timeout: 5000 });
      await courseDetailsPage.waitForSelector(".outcomes-grid", { timeout: 5000 });

      const detailState = await courseDetailsPage.evaluate(() => ({
        title: document.querySelector(".course-detail-main h1")?.textContent,
        outcome: document.querySelector(".outcomes-grid")?.textContent,
        hasErrorBoundary: Boolean(document.querySelector(".error-boundary")),
        doc: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
        inner: window.innerWidth
      }));
      assert(
        coursePageErrors.length === 0 && !detailState.hasErrorBoundary && detailState.outcome?.includes("Build a complete project"),
        `/courses/:slug renders API details without a React runtime error`
      );
      assert(
        detailState.doc <= detailState.inner && detailState.body <= detailState.inner,
        `/courses/:slug fits viewport (${vp.width}px): doc=${detailState.doc}px, body=${detailState.body}px, win=${detailState.inner}px`
      );
    } finally {
      await courseDetailsPage.close();
    }

    // 5. Test the marketplace seller and provider registration entry points
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

  // --- SECTION 3: Authenticated workspace mobile navigation and swipe rails ---
  console.log("\n==========================================");
  console.log("SECTION 3: Authenticated Workspace Mobile UX");
  console.log("==========================================");

  for (const vp of spaViewports.filter(({ width }) => width < 760)) {
    console.log(`\n--- Testing Workspace Viewport: ${vp.name} ---`);
    const workspacePage = await context.newPage();
    await workspacePage.setViewportSize({ width: vp.width, height: vp.height });

    try {
      await workspacePage.addInitScript(() => {
        window.localStorage.setItem("aiofront_user", JSON.stringify({
          id: "end-user",
          name: "Mobile QA User",
          email: "mobile.qa@ain.test",
          role: "end-user",
          roleLabel: "End User",
          company: "TechCorp Egypt",
          tenantId: "tenant_techcorp",
          permissions: ["view_assigned_rooms", "view_files"]
        }));
        window.sessionStorage.setItem("aiofront_token", "mobile-qa-session");
      });
      await workspacePage.route("**/api/**", (route) => {
        const data = route.request().url().includes("/workspaces")
          ? [{
              membershipId: "membership-mobile-qa",
              role: "student",
              permissions: ["view_courses", "view_files"],
              organization: { id: "org-mobile-qa", name: "TechCorp Egypt", nameAr: "تيك كورب", color: "#16458f", logo: "TC" },
              subscription: {
                status: "active",
                plan: {
                  code: "growth",
                  name: "Growth",
                  modules: ["courses", "announcements", "tasks", "attendance"].map((module) => ({ module, enabled: true, limit: null }))
                }
              }
            }]
          : [];
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, data })
        });
      });
      await workspacePage.goto(`${baseUrl}/end-user/home`, { waitUntil: "domcontentloaded", timeout: 15000 });
      await workspacePage.waitForSelector(".stitch-mobile-menu", { timeout: 5000 });

      const compactState = await workspacePage.evaluate(() => {
        const menu = document.querySelector(".stitch-mobile-menu");
        const stats = document.querySelector(".member-stat-grid");
        const dashboard = document.querySelector(".member-dashboard-grid");
        const statsStyle = stats ? window.getComputedStyle(stats) : null;
        const dashboardStyle = dashboard ? window.getComputedStyle(dashboard) : null;
        return {
          fitsViewport: document.documentElement.scrollWidth <= window.innerWidth && document.body.scrollWidth <= window.innerWidth,
          glyphBars: menu?.querySelectorAll(".mobile-menu-glyph i").length || 0,
          statsSwipeable: Boolean(stats && statsStyle?.overflowX === "auto" && stats.scrollWidth > stats.clientWidth),
          dashboardSwipeable: Boolean(dashboard && dashboardStyle?.overflowX === "auto" && dashboard.scrollWidth > dashboard.clientWidth)
        };
      });
      assert(compactState.fitsViewport, `Workspace fits viewport (${vp.width}px)`);
      assert(compactState.glyphBars === 3, "Workspace menu uses the professional three-line glyph");
      assert(compactState.statsSwipeable, "Workspace statistics use a horizontal swipe rail");
      assert(compactState.dashboardSwipeable, "Workspace dashboard cards use a horizontal swipe rail");

      await workspacePage.click(".stitch-mobile-menu");
      await workspacePage.waitForTimeout(150);
      const openedState = await workspacePage.evaluate(() => ({
        open: document.querySelector(".stitch-sidebar")?.classList.contains("mobile-open"),
        overlay: Boolean(document.querySelector(".stitch-mobile-overlay")),
        expanded: document.querySelector(".stitch-mobile-menu")?.getAttribute("aria-expanded"),
        bodyLocked: document.body.style.overflow === "hidden"
      }));
      assert(openedState.open && openedState.overlay, "Workspace drawer and backdrop open from the menu button");
      assert(openedState.expanded === "true" && openedState.bodyLocked, "Workspace drawer exposes state and locks background scrolling");

      await workspacePage.keyboard.press("Escape");
      await workspacePage.waitForTimeout(150);
      const closedState = await workspacePage.evaluate(() => ({
        open: document.querySelector(".stitch-sidebar")?.classList.contains("mobile-open"),
        overlay: Boolean(document.querySelector(".stitch-mobile-overlay")),
        expanded: document.querySelector(".stitch-mobile-menu")?.getAttribute("aria-expanded"),
        bodyUnlocked: document.body.style.overflow !== "hidden"
      }));
      assert(!closedState.open && !closedState.overlay, "Workspace drawer closes with Escape");
      assert(closedState.expanded === "false" && closedState.bodyUnlocked, "Workspace drawer restores its accessible and scroll state");
    } finally {
      await workspacePage.close();
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
