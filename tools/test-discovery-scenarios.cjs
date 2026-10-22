// Run with Node.js and Playwright installed (or supplied through NODE_PATH).
// Test-only inspection is injected by the local server; it is never shipped in index.html.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const output = process.env.SCULPTURE_TEST_OUTPUT || '/tmp/interactive-sculpture-tests';
const probe = `
window.__discoveryTest = {
  snapshot: () => ({
    scenario: activeScenarioId, discoveries: DISCOVERIES,
    found: [...state.foundDiscoveries], panels: discoveryMarkers.filter(m => m.revealPanel).length,
    canvasReady: Boolean(supportCanvasScenarioTexture), canvasFactor: canvasUnlockFactor(),
    canvasWidth: supportCanvasScenarioTexture?.image.width,
    canvasHeight: supportCanvasScenarioTexture?.image.height,
    canvasIsScenarioImage: supportCanvasMaterials.every(m => m.map === supportCanvasScenarioTexture),
    spotlight: discoverySpotlight.intensity,
    regionNames: Object.fromEntries(Object.entries(regionsData).map(([k,v]) => [k,v.name])),
    regionLights: Object.fromEntries(Object.entries(regionLights).map(([k,v]) => [k,v.intensity])),
    table: tableModelSelected, environment: Boolean(scenarioEnvironmentRoot),
    hovered: state.hoveredMarker?.data.id || state.hoveredRegion
  }),
  markerPosition: index => {
    const marker = discoveryMarkers[index];
    const point = marker.mesh.getWorldPosition(new THREE.Vector3()).project(camera);
    const rect = canvas.getBoundingClientRect();
    return { x: rect.left + (point.x + 1) * rect.width / 2, y: rect.top + (1 - point.y) * rect.height / 2 };
  },
  artwork: () => supportCanvasMaterials[0]?.map?.image?.toDataURL?.(),
  revealBounds: () => discoveryMarkers.filter(m => m.revealPanel).map(m => {
    const sprite = m.revealPanel;
    const center = sprite.getWorldPosition(new THREE.Vector3());
    const scale = sprite.getWorldScale(new THREE.Vector3());
    const corners = [-0.5, 0.5].flatMap(x => [-0.5, 0.5].map(y => {
      const p = new THREE.Vector3(x * scale.x, y * scale.y, 0).applyQuaternion(camera.quaternion).add(center).project(camera);
      return { x: (p.x + 1) * innerWidth / 2, y: (1 - p.y) * innerHeight / 2 };
    }));
    return { left: Math.min(...corners.map(p => p.x)), right: Math.max(...corners.map(p => p.x)), top: Math.min(...corners.map(p => p.y)), bottom: Math.max(...corners.map(p => p.y)) };
  }),
  export: buildScenarioJSON,
  validate: validateSpiritualFreedomScenario
};
`;

async function main() {
  await fs.mkdir(output, { recursive: true });
  const server = http.createServer(async (req, res) => {
    try {
      let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      if (pathname.endsWith('/')) pathname += 'index.html';
      const filename = path.resolve(root, '.' + pathname);
      if (!filename.startsWith(root + path.sep)) throw new Error('Invalid path');
      let body = await fs.readFile(filename);
      if (filename.endsWith('/index.html')) {
        const html = body.toString();
        const end = html.lastIndexOf('</script>');
        body = Buffer.from(html.slice(0, end) + probe + html.slice(end));
      }
      const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.mp4': 'video/mp4' };
      res.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream' });
      res.end(body);
    } catch (_) { res.writeHead(404); res.end('Not found'); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ channel: process.env.SCULPTURE_BROWSER_CHANNEL || 'chrome', headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [], requests = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', req => requests.push(req.url()));
    await page.route('**/data/slides-discoveries.json*', route => route.abort());
    await page.goto(base + '/?scenario=spiritual-freedom');
    await page.waitForFunction(() => window.__discoveryTest?.snapshot().discoveries.length === 5 && window.__discoveryTest.snapshot().canvasReady, null, { timeout: 30000 });
    let snapshot = await page.evaluate(() => window.__discoveryTest.snapshot());
    assert.equal(snapshot.scenario, 'spiritual-freedom');
    assert.equal(snapshot.found.length, 0);
    assert.equal(snapshot.panels, 0);
    assert.equal(snapshot.canvasFactor, 0);
    assert.equal(snapshot.canvasWidth, 1024);
    assert.equal(snapshot.canvasHeight, 1536);
    assert.equal(snapshot.canvasIsScenarioImage, true);
    assert.equal(snapshot.regionNames.base, 'Πόδια');
    assert.equal(snapshot.regionNames.core, 'Καρδιά');
    assert.equal(requests.some(url => url.includes('slides-discoveries.json') || url.includes('docs.google.com')), false);
    const originalArtwork = await page.evaluate(() => window.__discoveryTest.artwork());
    await page.screenshot({ path: path.join(output, 'spiritual-freedom-start.png') });

    for (let i = 0; i < 5; i++) {
      const point = await page.evaluate(index => window.__discoveryTest.markerPosition(index), i);
      await page.mouse.click(point.x, point.y);
      await page.waitForFunction(count => window.__discoveryTest.snapshot().found.length === count, i + 1, { timeout: 5000 });
      snapshot = await page.evaluate(() => window.__discoveryTest.snapshot());
      assert.equal(snapshot.panels, i + 1);
      assert.equal(snapshot.canvasFactor, i === 4 ? 1 : 0);
      if (i === 1) {
        // Outlast the Slides polling interval and ensure neither progress nor the source changes.
        await page.waitForTimeout(31000);
        assert.equal((await page.evaluate(() => window.__discoveryTest.snapshot())).found.length, 2);
        assert.equal(requests.some(url => url.includes('slides-discoveries.json')), false);
      }
    }
    await page.waitForTimeout(2500);
    snapshot = await page.evaluate(() => window.__discoveryTest.snapshot());
    assert.equal(snapshot.found.length, 5);
    assert.ok(snapshot.spotlight > 0);
    for (const region of ['head', 'arms', 'trunk', 'base', 'core']) assert.ok(snapshot.regionLights[region] > 0);
    const toolbar = await page.locator('#toggle-row').boundingBox();
    for (const bounds of await page.evaluate(() => window.__discoveryTest.revealBounds())) {
      assert.ok(bounds.left >= 0 && bounds.right <= 1440 && bounds.bottom <= 1000, 'Answer panel must fit in the viewport');
      assert.ok(bounds.top >= toolbar.y + toolbar.height, 'Answer panel must clear the toolbar');
    }
    await page.screenshot({ path: path.join(output, 'spiritual-freedom-complete.png') });

    await page.locator('#btn-canvas').click();
    await page.locator('#canvas-image-input').setInputFiles({
      name: 'temporary.png', mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2ioAAAAASUVORK5CYII=', 'base64')
    });
    await page.waitForFunction(() => !window.__discoveryTest.snapshot().canvasIsScenarioImage);
    await page.getByRole('button', { name: '↺ ΕΠΑΝΑΦΟΡΑ ΑΡΧΙΚΗΣ ΕΙΚΟΝΑΣ' }).click();
    assert.equal(await page.evaluate(() => window.__discoveryTest.artwork()), originalArtwork);
    assert.ok((await page.locator('#canvas-status').textContent()).includes('Ίαση των παθών'));

    await page.locator('#btn-scenario').click();
    await page.locator('#scenario-json-editor-button').click();
    const exported = JSON.parse(await page.locator('#json-editor').inputValue());
    assert.equal(exported.discoveries.length, 5);
    assert.equal(exported.sourcePresentation.slideNumber, 6);
    assert.equal(exported.canvas.backgroundImage, './assets/healing-passions-spiritual-freedom.png');
    assert.equal(await page.evaluate(data => Boolean(window.__discoveryTest.validate(data)), exported), true);
    const invalid = structuredClone(exported);
    invalid.discoveries[1].region = invalid.discoveries[0].region;
    assert.equal(await page.evaluate(data => {
      try { window.__discoveryTest.validate(data); return false; } catch (_) { return true; }
    }, invalid), true);
    const importDialog = page.waitForEvent('dialog');
    await page.getByRole('button', { name: '📥 ΕΙΣΑΓΩΓΗ', exact: true }).click();
    const dialog = await importDialog;
    assert.ok(dialog.message().includes('επιτυχώς'));
    await dialog.accept();
    await page.waitForFunction(() => window.__discoveryTest.snapshot().found.length === 0);
    assert.equal((await page.evaluate(() => window.__discoveryTest.snapshot())).panels, 0);
    console.log('PASS: five real clue clicks, hidden answers, progressive light, 31s without Slides sync, artwork restore, JSON round trip');

    // Check the existing standalone scenario and the legacy URL-to-menu transition.
    await page.goto(base + '/?scenario=circular-table');
    await page.waitForFunction(() => window.__discoveryTest?.snapshot().discoveries.length === 6 && window.__discoveryTest.snapshot().canvasReady && window.__discoveryTest.snapshot().environment, null, { timeout: 30000 });
    snapshot = await page.evaluate(() => window.__discoveryTest.snapshot());
    assert.equal(snapshot.table, true);
    assert.equal(snapshot.panels, 0);
    assert.equal(snapshot.found.length, 0);
    const tableExport = await page.evaluate(() => window.__discoveryTest.export());
    assert.ok(tableExport.environmentModel.modelUrl);
    assert.equal(tableExport.questions.length, 6);
    console.log('PASS: circular table still loads six clues, its model, environment and hymn canvas');

    await page.unroute('**/data/slides-discoveries.json*');
    await page.goto(base + '/?mode=slides-discovery&sculpture=circular-table');
    await page.waitForFunction(() => window.__discoveryTest?.snapshot().discoveries.length > 0, null, { timeout: 30000 });
    await page.locator('#btn-scenario').click();
    await Promise.all([
      page.waitForURL('**/?scenario=spiritual-freedom'),
      page.locator('#scenario-select').selectOption('spiritual-freedom')
    ]);
    await page.waitForFunction(() => window.__discoveryTest?.snapshot().discoveries.length === 5 && window.__discoveryTest.snapshot().canvasReady);
    assert.equal(new URL(page.url()).searchParams.has('mode'), false);
    assert.equal(new URL(page.url()).searchParams.has('sculpture'), false);
    assert.deepEqual(errors, []);
    console.log('PASS: existing Slides discovery and switching from its legacy URL to the new scenario');
    console.log('Screenshots:', output);
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
