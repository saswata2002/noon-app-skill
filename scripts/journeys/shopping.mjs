// Shopping hand-offs: search → PLP, PLP filters / sort, PLP → PDP → add to cart, cart → checkout.
import { cartBadge, expect, isSheetOnTop, nav, open, tap, top, waitFor, waitRoute } from './lib.mjs';

const boxes = (page) => page.locator('[data-route="plp/listing"] [data-testid=product_box]');
const pill = (page, name) => page.locator('[data-route="plp/listing"] [class*=pills] button', { hasText: name });
const plpScroll = async (page) => (await page.locator('[data-route="plp/listing"] .nk-scroll').first().evaluate((el) => el.scrollTop));
/** the grid's card count once it has grown to `want` (≤ 5s): after a filter swap the first screen lands, then the cards
 *  below the fold join in idle batches */
async function gridCount(page, want) {
  for (let t0 = Date.now(); Date.now() - t0 < 5000; await page.waitForTimeout(100)) if ((await boxes(page).count()) === want) break;
  return boxes(page).count();
}
async function scrollPlp(page, y) {
  await page.locator('[data-route="plp/listing"] .nk-scroll').first().evaluate((el, y) => el.scrollTo({ top: y }), y);
  await page.waitForTimeout(500);
  return plpScroll(page);
}

export default [
  {
    name: 'search-to-plp',
    area: 'shopping',
    title: 'Search → results hand-off: no empty frame, the bar stays put, results load',
    async run(page, shot) {
      await open(page, 'search/search', { settle: 1200 });
      await page.keyboard.type('phone', { delay: 30 });
      await page.waitForTimeout(900);
      await shot('suggestions');
      const bar = await page.locator('input:visible').first().boundingBox();
      await page.keyboard.press('Enter');
      // sample the hand-off: a search bar must be on screen in every frame, at the same spot
      const frames = [];
      for (let i = 0; i < 30; i++) {
        frames.push(await page.evaluate(() => [...document.querySelectorAll('input')].filter((x) => x.offsetParent).map((x) => { const r = x.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y)]; })));
        await page.waitForTimeout(25);
      }
      expect(frames.every((f) => f.length > 0), 'a frame without a search bar (empty Suspense frame) during the hand-off');
      expect(frames.every((f) => f.every(([x, y]) => Math.abs(x - Math.round(bar.x)) <= 1 && Math.abs(y - Math.round(bar.y)) <= 1)), `the search bar moved during the hand-off: ${JSON.stringify(frames.flat().slice(0, 6))}`);
      const n = await waitRoute(page, 'plp/listing');
      expect(n.params.query === 'phone', `PLP query is "${n.params.query}", expected "phone"`);
      expect(n.stack.join() === 'search/search,plp/listing', `stack is ${n.stack.join(' → ')}, expected search/search → plp/listing`);
      await page.waitForTimeout(1600);
      const count = await boxes(page).count();
      expect(count >= 4, `only ${count} product boxes on the PLP`);
      await shot('results');
    },
  },
  {
    name: 'plp-filter',
    area: 'filters',
    title: 'PLP quick pill filters the grid and counts on Filter; tapping again clears it',
    async run(page, shot) {
      await open(page, 'plp/listing?query=phone', { settle: 2500, expectRoute: 'plp/listing' });
      const before = await boxes(page).count();
      await pill(page, /^Samsung$/).click();
      await page.waitForTimeout(1400);
      const names = await page.locator('[data-route="plp/listing"] [data-testid=product_box] [class*=name]').allInnerTexts();
      expect(names.length > 0 && names.length < before, `Samsung filter left ${names.length} of ${before} results`);
      expect(names.every((t) => t.startsWith('Samsung')), `non-Samsung results after the brand filter: ${names.filter((t) => !t.startsWith('Samsung')).slice(0, 2).join(' / ')}`);
      const filterText = await page.locator('[data-route="plp/listing"] [class*=pills] button').first().innerText();
      expect(/1/.test(filterText), `Filter pill shows no count: "${filterText}"`);
      await shot('samsung-selected');
      await pill(page, /^Samsung$/).click();
      const after = await gridCount(page, before);
      expect(after === before, `clearing the filter shows ${after} results, expected ${before}`);
      await shot('cleared');
    },
  },
  {
    name: 'plp-filter-sheet',
    area: 'filters',
    title: 'Filters sheet: a facet pick commits on "Show N results", the grid shows N from the top; Clear All restores it',
    async run(page, shot) {
      await open(page, 'plp/listing?query=phone', { settle: 2500, expectRoute: 'plp/listing' });
      const before = await boxes(page).count();
      const y = await scrollPlp(page, 1400);
      expect(y > 300, `the PLP did not scroll (scrollTop ${y})`);
      await tap(page, page.locator('[data-route="plp/listing"] [class*=pills] button').first(), { scroll: false });
      await waitRoute(page, 'plp/filters');
      await page.waitForTimeout(600);
      await shot('filters-open');
      const sheet = await top(page);
      // first facet with more than one option: tap its first pill and read the live count on "Show N results"
      const show = sheet.getByRole('button', { name: /Show\s*\d+\s*results/ });
      const showN = async () => Number((await show.innerText()).replace(/\D/g, ''));
      expect((await showN()) === before, `"Show N results" reads ${await showN()} before any pick, the grid has ${before}`);
      const brand = sheet.getByRole('button', { name: /^Brand/ });
      if (await brand.count()) await brand.first().click();
      await page.waitForTimeout(300);
      const option = sheet.locator('[class*=pills] button').first();
      const label = (await option.innerText()).trim();
      await option.click();
      const n = await waitFor(async () => { const v = await showN(); return v !== before && v; }, `picking "${label}" did not change "Show N results" (${before})`);
      await shot('facet-picked');
      await show.click();
      await waitRoute(page, 'plp/listing', 'plp/listing (filters committed)');
      const after = await gridCount(page, n);
      expect(after === n, `grid shows ${after} results, the sheet promised ${n}`);
      const scrolled = await plpScroll(page);
      expect(scrolled < 5, `the grid did not restart at the top after the filter (scrollTop ${scrolled})`);
      const filterText = await page.locator('[data-route="plp/listing"] [class*=pills] button').first().innerText();
      expect(/1/.test(filterText), `Filter pill shows no count after one facet: "${filterText}"`);
      await shot('filtered');
      // reopen → Clear All → Show: everything is back
      await tap(page, page.locator('[data-route="plp/listing"] [class*=pills] button').first(), { scroll: false });
      await waitRoute(page, 'plp/filters');
      await page.waitForTimeout(500);
      const sheet2 = await top(page);
      await sheet2.getByRole('button', { name: 'Clear All' }).click();
      await page.waitForTimeout(300);
      await shot('cleared-draft');
      await sheet2.getByRole('button', { name: /Show\s*\d+\s*results/ }).click();
      await waitRoute(page, 'plp/listing', 'plp/listing (filters cleared)');
      const restored = await gridCount(page, before);
      expect(restored === before, `Clear All shows ${restored} results, expected ${before}`);
      const pillText = await page.locator('[data-route="plp/listing"] [class*=pills] button').first().innerText();
      expect(!/\d/.test(pillText), `Filter pill still shows a count after Clear All: "${pillText}"`);
      await shot('restored');
    },
  },
  {
    name: 'plp-sort-sheet',
    area: 'filters',
    title: 'Sort opens as a sheet, picking an option closes it, reorders the grid and restarts it at the top',
    async run(page, shot) {
      await open(page, 'plp/listing?query=phone', { settle: 2500, expectRoute: 'plp/listing' });
      await scrollPlp(page, 900);
      await pill(page, /^Sort$/).click();
      await waitRoute(page, 'plp/sort');
      await page.waitForTimeout(500);
      await shot('sheet-open');
      await page.getByText('Price: Low to High', { exact: true }).click();
      await waitRoute(page, 'plp/listing', 'plp/listing (sheet closed)');
      await page.waitForTimeout(1400);
      const label = await page.locator('[data-route="plp/listing"] [class*=pills] button').nth(1).innerText();
      expect(/Price Low to High/.test(label), `Sort pill reads "${label}"`);
      const prices = (await page.locator('[data-route="plp/listing"] [data-testid=product_box] [class*=sale]').allInnerTexts()).map((t) => Number(t.replace(/[^\d.]/g, '')));
      expect(prices.length > 2 && prices.every((p, i) => i === 0 || p >= prices[i - 1]), `prices are not ascending: ${prices.slice(0, 6).join(', ')}`);
      const y = await plpScroll(page);
      expect(y < 5, `the grid did not restart at the top after sorting (scrollTop ${y})`);
      await shot('sorted');
    },
  },
  {
    name: 'pdp-add-to-cart',
    area: 'shopping',
    title: 'PLP → PDP → Add to cart updates the cart; Back returns to the same results',
    async run(page, shot) {
      await open(page, 'plp/listing?query=phone', { settle: 2500, expectRoute: 'plp/listing' });
      const first = boxes(page).first();
      const name = (await first.locator('[class*=name]').innerText()).trim();
      await first.locator('[class*=name]').click();
      const n = await waitRoute(page, 'pdp/detail');
      expect(n.stack.includes('plp/listing'), `PDP was not pushed on top of the PLP (stack ${n.stack.join(' → ')})`);
      await page.waitForTimeout(1500);
      await shot('pdp');
      const badge = await cartBadge(page);
      // the footer ATC (product-card "+" buttons are also named "Add to cart", so match the visible label)
      await page.locator('[data-route="pdp/detail"] button:visible', { hasText: /^Add to cart$/ }).last().click();
      await page.waitForTimeout(1200);
      const after = await cartBadge(page);
      const route = (await nav(page)).route;
      expect(after === badge + 1 || route === 'pdp/added' || route === 'pdp/variants', `Add to cart did nothing (badge ${badge} → ${after}, route ${route})`);
      await shot('added');
      // close the sheet that opened (tap its scrim), then the PDP header's Back — the app's own controls,
      // never history.back() (the preview keeps the URL with replaceState, so browser Back leaves the app)
      for (let i = 0; i < 4 && (await nav(page)).route !== 'plp/listing'; i++) {
        const r = (await nav(page)).route;
        const keepShopping = page.getByRole('button', { name: /continue shopping/i });
        // a dismissed sheet's scrim fades out for a moment and still takes taps: wait for it to go
        if (r === 'pdp/detail') await page.waitForFunction(() => !document.querySelector('[class*=scrim]'), null, { timeout: 3000 }).catch(() => undefined);
        if (r === 'pdp/detail') await tap(page, page.locator('[data-route="pdp/detail"]').last().getByRole('button', { name: 'Back', exact: true }).first(), { scroll: false });
        else if (await keepShopping.isVisible().catch(() => false)) await keepShopping.click();
        else if (await isSheetOnTop(page)) await page.locator('[class*=scrim]').last().click({ position: { x: 20, y: 20 }, timeout: 3000 });
        await page.waitForTimeout(800);
      }
      const n2 = await waitRoute(page, 'plp/listing', 'plp/listing after Back');
      expect(n2.params.query === 'phone', `Back lost the query: "${n2.params.query}"`);
      const firstAgain = (await boxes(page).first().locator('[class*=name]').innerText()).trim();
      expect(firstAgain === name, `Back shows different results (first "${firstAgain}", was "${name}")`);
      await shot('back-on-plp');
    },
  },
  {
    name: 'pdp-variant-in-place',
    area: 'pdp',
    title: 'PDP variant tap switches the SKU in place: same route and stack, new title, the picker stays put (±4px) in every frame',
    async run(page, shot) {
      await open(page, 'pdp/detail', { settle: 2200 });
      const pdp = page.locator('[data-route="pdp/detail"]').last();
      const titleOf = async () => (await pdp.locator('[class*=titleToggle]').first().innerText()).trim();
      const title0 = await titleOf();
      const n0 = await nav(page);
      // the first selectable option tile that is not the current SKU, scrolled to the middle of the screen
      const tile = pdp.locator('button[data-kind]:not([disabled])').first();
      expect(await tile.count(), 'no selectable variant option on the PDP');
      await tile.evaluate((el) => el.scrollIntoView({ block: 'center' }));
      await page.waitForTimeout(900);
      const picker = pdp.locator('[class*=_picker_]:has(button[data-kind])').first();
      const y0 = (await picker.boundingBox()).y;
      const label = (await tile.innerText()).split('\n')[0].trim();
      await shot('before-switch');
      await tap(page, tile, { scroll: false });
      // sample the picker's screen position while the option reloads and the new SKU lays out
      const ys = [];
      for (let i = 0; i < 40; i++) {
        const b = await picker.boundingBox().catch(() => null);
        if (b) ys.push(Math.round(b.y - y0));
        await page.waitForTimeout(30);
      }
      const title1 = await waitFor(async () => { const t = await titleOf(); return t !== title0 && t; }, `tapping "${label}" did not switch the product (title still "${title0}")`);
      const n1 = await nav(page);
      expect(n1.route === 'pdp/detail' && n1.stack.length === n0.stack.length, `the variant switch navigated: ${n0.stack.join(' → ')} → ${n1.stack.join(' → ')}`);
      const worst = ys.reduce((m, d) => (Math.abs(d) > Math.abs(m) ? d : m), 0);
      expect(Math.abs(worst) <= 4, `the variant picker jumped ${worst}px during the switch (offsets ${[...new Set(ys)].slice(0, 8).join(', ')})`);
      const yEnd = (await picker.boundingBox()).y;
      expect(Math.abs(yEnd - y0) <= 4, `the variant picker moved ${Math.round(yEnd - y0)}px after the switch`);
      await shot('after-switch');
      expect(title1.length > 0, 'empty title after the switch');
    },
  },
  {
    name: 'cart-checkout',
    area: 'checkout',
    title: 'Cart: the order summary opens and closes from the footer, Checkout goes to checkout',
    async run(page, shot) {
      await open(page, 'cart/cart', { settle: 2500 });
      const toggle = page.locator('[data-route="cart/cart"] [class*=footer] button[aria-expanded]');
      expect((await toggle.count()) === 1, 'no footer total toggle');
      await toggle.click();
      await page.waitForTimeout(700);
      expect(await page.getByText('Order Summary').first().isVisible(), 'order summary did not open');
      expect((await page.locator('[data-route="cart/cart"] [class*=footer] button[aria-expanded=true]').count()) === 1, 'toggle not marked expanded');
      await shot('summary-open');
      await toggle.click();
      await page.waitForTimeout(700);
      expect((await page.locator('[data-route="cart/cart"] [class*=footer] button[aria-expanded=false]').count()) === 1, 'order summary did not close');
      await page.locator('[data-route="cart/cart"]').getByRole('button', { name: /^Checkout$/ }).click();
      // non-members get the noon One push first (bappzaar showVipPush → VIPCartOverlayScreen); × continues to checkout
      const first = await waitRoute(page, (r) => r.startsWith('checkout/') || r === 'noonone/cartOverlay', 'checkout/* or noonone/cartOverlay');
      if (first.route === 'noonone/cartOverlay') {
        await page.waitForTimeout(700);
        await shot('noon-one-push');
        await (await top(page)).getByRole('button', { name: /close/i }).first().click();
      }
      const n = await waitRoute(page, (r) => r.startsWith('checkout/'), 'checkout/*');
      expect(n.stack[0] === 'cart/cart', `checkout is not on top of the cart (stack ${n.stack.join(' → ')})`);
      await page.waitForTimeout(1200);
      await shot(n.route.replace('/', '-'));
    },
  },
];

