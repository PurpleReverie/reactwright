import test from "node:test";
import assert from "node:assert/strict";

import { parseStylesheet } from "../../src/styles/parser.js";
import { lowerStylesheet } from "../../src/styles/lower.js";

function lower(source: string): string {
  return lowerStylesheet(parseStylesheet(source));
}

test("lower: pass-through CSS properties unchanged", () => {
  const css = lower(".foo { color: red; font-size: 10pt; }");
  assert.equal(css, ".foo{color:red;font-size:10pt;}");
});

test("lower: numbering with explicit counter-style", () => {
  const css = lower(`.sec-head { numbering: counter(sec, upper-roman) "$sec. "; }`);
  assert.match(css, /\.sec-head\{counter-increment:sec;\}/);
  assert.match(css, /\.sec-head::before\{content:counter\(sec,upper-roman\) '\. ';\}/);
});

test("lower: numbering with default counter-style", () => {
  const css = lower(`.fig-cap { numbering: counter(fig) "Fig. $fig. "; }`);
  assert.match(css, /\.fig-cap\{counter-increment:fig;\}/);
  assert.match(css, /\.fig-cap::before\{content:'Fig\. ' counter\(fig\) '\. ';\}/);
});

test("lower: numbering with hierarchical format", () => {
  const css = lower(`.nest { numbering: counter(sub) "$chap.$sub "; }`);
  assert.match(css, /\.nest::before\{content:counter\(chap\) '\.' counter\(sub\) ' ';\}/);
});

test("lower: numbering-reset", () => {
  const css = lower(`.head { numbering-reset: figure equation; }`);
  assert.match(css, /\.head\{counter-reset:figure equation;\}/);
});

test("lower: prefix and suffix", () => {
  const css = lower(`.cite { prefix: "["; suffix: counter(bib) "]"; }`);
  assert.match(css, /\.cite::before\{content:"\[";\}/);
  assert.match(css, /\.cite::after\{content:counter\(bib\) "\]";\}/);
});

test("lower: break with before/after/inside", () => {
  const css = lower(`.head { break: before(auto) after(avoid) inside(avoid); }`);
  assert.match(css, /break-before:auto;/);
  assert.match(css, /page-break-before:auto;/);
  assert.match(css, /break-after:avoid;/);
  assert.match(css, /page-break-after:avoid;/);
  assert.match(css, /break-inside:avoid;/);
  assert.match(css, /page-break-inside:avoid;/);
});

test("lower: break with single axis", () => {
  const css = lower(`.fig { break: inside(avoid); }`);
  assert.match(css, /break-inside:avoid;page-break-inside:avoid;/);
  // No before/after emitted
  assert.doesNotMatch(css, /break-before:/);
  assert.doesNotMatch(css, /break-after:/);
});

test("lower: combined dialect + pass-through in one rule", () => {
  const css = lower(`
    .ieee-section-head {
      font-size: 10pt;
      text-transform: uppercase;
      numbering: counter(sec, upper-roman) "$sec. ";
      numbering-reset: sub;
      break: after(avoid);
    }
  `);
  // Base block has pass-through + counter-increment + counter-reset + break-after
  assert.match(css, /\.ieee-section-head\{font-size:10pt;text-transform:uppercase;counter-increment:sec;counter-reset:sub;break-after:avoid;page-break-after:avoid;\}/);
  // ::before with the formatted counter
  assert.match(css, /\.ieee-section-head::before\{content:counter\(sec,upper-roman\) '\. ';\}/);
});

test("lower: malformed numbering falls through to pass-through", () => {
  // No `counter(...)` form — author probably meant `numbering-reset`.
  // Engine emits the verbatim property:value so the author sees the
  // mistake in the browser rather than getting a silent drop.
  const css = lower(`.x { numbering: "foo"; }`);
  assert.match(css, /numbering:"foo";/);
});
