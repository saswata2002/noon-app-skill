// Sheets: open from a button, close with the sheet's own control, a scrim tap and a drag on the grabber; the variants
// sheet refuses Add to cart until a size is picked.
import { cartBadge, expect, isSheetOnTop, nav, open, scrimTap, tap, top, waitFor, waitRoute } from './lib.mjs';

const pills = (page) => page.locator('[data-route="plp/listing"] [class*=pills] button');

/** after a dismiss: back on `route`, one entry, the sheet layer and its scrim unmounted, the screen takes taps again */
async function expectClosed(page, route, how) {
  const n = await waitRoute(page, route, `${route} (sheet closed by ${how})`);
  expect(n.stack.length === 1, `${how}: stack is ${n.stack.join(' → ')}`);
  await waitFor(async () => (await page.locator('[class*=sheetLayer]').count()) === 0, `${how}: the sheet layer / scrim is still mounted 3s after closing`, 3000);
  const pe = await page.locator(`[data-route="${route}"]`).last().evaluate((el) => el.style.pointerEvents);
  expect(pe === 'auto', `${how}: ${route} has pointer-events ${pe} after the sheet closed`);
}

export default [
  {
    name: 'sheet-dismiss',
    area: 'sheets',
    title: 'PLP Filters / Sort sheets close via a tap on the floating handle (Filters has no close button, as in bappzaar), a scrim tap and a drag down on the grabber',
    async run(page, shot) {
      await open(page, 'plp/listing?query=phone', { settle: 2200, expectRoute: 'plp/listing' });
      // Filters: floating sheet (OverlayBottomSheet isFloating) — the handle closes it on tap; there is no Close button
      await tap(page, pills(page).first(), { scroll: false });
      await waitRoute(page, 'plp/filters');
      await page.waitForTimeout(600);
      expect(await isSheetOnTop(page), 'plp/filters is not presented as a sheet');
      await shot('filters-open');
      expect((await (await top(page)).getByRole('button', { name: 'Close', exact: true }).count()) === 0, 'the Filters sheet shows a Close button (bappzaar has none)');
      await (await top(page)).locator('[class*=floatingHandleZone]').first().click();
      await expectClosed(page, 'plp/listing', 'handle tap');
      await shot('closed-by-handle');
      // Filters: scrim tap
      await tap(page, pills(page).first(), { scroll: false });
      await waitRoute(page, 'plp/filters');
      await page.waitForTimeout(600);
      await scrimTap(page);
      await expectClosed(page, 'plp/listing', 'scrim tap');
      // Sort: scrim tap
      await tap(page, pills(page).filter({ hasText: /^Sort$/ }), { scroll: false });
      await waitRoute(page, 'plp/sort');
      await page.waitForTimeout(600);
      await shot('sort-open');
      await scrimTap(page);
      await expectClosed(page, 'plp/listing', 'scrim tap (sort)');
      await shot('closed-by-scrim');
      // Sort: drag the grabber down
      await tap(page, pills(page).filter({ hasText: /^Sort$/ }), { scroll: false });
      await waitRoute(page, 'plp/sort');
      await page.waitForTimeout(700);
      const grab = (await top(page)).locator('[class*=grabberZone]').first();
      const box = await grab.boundingBox();
      expect(box, 'the sort sheet has no grabber');
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      for (let i = 1; i <= 12; i++) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + i * 22);
        await page.waitForTimeout(16);
      }
      await page.mouse.up();
      await expectClosed(page, 'plp/listing', 'drag down');
      await shot('closed-by-drag');
    },
  },
  {
    name: 'pdp-variants-size-warning',
    area: 'sheets',
    title: 'Variants sheet: ADD TO CART without a size warns and adds nothing; pick a size → closes, badge +1',
    async run(page, shot) {
      // the sheet a sized product card's + opens (ProductCard QuickAdd → pdp/variants); p3 is the fashion mock
      await open(page, 'pdp/variants?productId=p3', { settle: 1600, expectRoute: 'pdp/variants' });
      const n0 = await nav(page);
      expect(n0.stack.join() === 'pdp/detail,pdp/variants', `variants sheet stack is ${n0.stack.join(' → ')}`);
      const sheet = await top(page);
      const badge0 = await cartBadge(page);
      await shot('sheet');
      const atc = sheet.getByRole('button', { name: /^ADD TO CART$/i });
      await tap(page, atc, { scroll: false });
      await page.waitForTimeout(600);
      expect(await sheet.getByText(/please select (the |a )?size/i).first().isVisible(), 'no "Please select the size" warning after ADD TO CART without a size');
      expect((await nav(page)).route === 'pdp/variants', 'the sheet closed without a size');
      expect((await cartBadge(page)) === badge0, 'the cart changed without a size');
      await shot('size-warning');
      const size = sheet.locator('button[class*=_cartChip_]:not([disabled])').first();
      const sizeName = (await size.innerText()).trim();
      await tap(page, size, { scroll: false });
      await waitFor(async () => (await sheet.locator('button[class*=_cartChip_][data-selected]').count()) === 1, `tapping size ${sizeName} did not select it`);
      await page.waitForTimeout(300);
      expect(!(await sheet.getByText(/please select (the |a )?size/i).count()), `the warning stays after picking size ${sizeName}`);
      await shot('size-picked');
      await tap(page, atc, { scroll: false });
      await waitRoute(page, 'pdp/detail', 'pdp/detail (sheet closed after ATC)');
      // the demo runs with toasts off (Navigator toasts={false}), so the badge is the confirmation
      const badge1 = await waitFor(async () => { const b = await cartBadge(page); return b === badge0 + 1 && b; }, '').catch(() => cartBadge(page));
      expect(badge1 === badge0 + 1, `cart badge ${badge0} → ${badge1} after ATC with size ${sizeName}`);
      await shot('added-toast');
    },
  },
  {
    name: 'home-address-sheet',
    area: 'sheets',
    title: 'Home address tap opens the address book over home (isBottomSheet); picking another address closes it; a dimmed-page tap closes it',
    async run(page, shot) {
      await open(page, 'home/home', { settle: 1600 });
      const address = (await top(page)).locator('button:has(img[src*="delivery-home"])').first();
      await tap(page, address, { scroll: false });
      let n = await waitRoute(page, 'address/selectSheet', 'address/selectSheet (home address tap)');
      expect(n.stack.join() === 'home/home,address/selectSheet', `stack ${n.stack.join(' → ')}`);
      const sheet = page.locator('[data-route="address/selectSheet"]').last();
      await waitFor(async () => (await sheet.getByText('Work', { exact: true }).count()) > 0, 'the saved addresses did not load in the sheet', 4000);
      await shot('open');
      // the dimmed page closes it (AddressV2FloatingOverlay onOverlayClose)
      await sheet.locator('[class*=scrim]').first().click({ position: { x: 20, y: 40 } });
      n = await waitRoute(page, 'home/home', 'home/home (scrim tap)');
      expect(n.stack.length === 1, `scrim tap: stack is ${n.stack.join(' → ')}`);
      await page.waitForTimeout(500);
      // reopen → pick another address → closes, then the toast
      await tap(page, (await top(page)).locator('button:has(img[src*="delivery-home"])').first(), { scroll: false });
      await waitRoute(page, 'address/selectSheet', 'address/selectSheet (reopen)');
      const again = page.locator('[data-route="address/selectSheet"]').last();
      await waitFor(async () => (await again.getByText('Work', { exact: true }).count()) > 0, 'the saved addresses did not load on reopen', 4000);
      await tap(page, again.getByText('Work', { exact: true }).first());
      await waitRoute(page, 'home/home', 'home/home (address picked)', 4000);
      // no "Address updated" toast: the demo runs with toasts off (Navigator toasts={false})
      await shot('picked');
    },
  },
];
