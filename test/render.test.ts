import assert from "node:assert/strict";
import test from "node:test";
import { createMetroLayout } from "../src/layout.js";
import { escapeHtml, renderMetroHtml } from "../src/render.js";
import { branch, commit, history } from "./helpers.js";

test("embeds the three paintings once so exported maps are portable", () => {
  const commits = [commit("A")];
  const html = renderMetroHtml(history(commits), createMetroLayout(commits), {
    title: "Painted history", theme: "auto", privacy: "standard",
  });
  const embedded = [...html.matchAll(/data:image\/webp;base64,([A-Za-z0-9+/=]+)/g)];
  assert.equal(embedded.length, 3, "reuse embedded assets instead of duplicating them");
  for (const image of embedded) {
    const bytes = Buffer.from(image[1]!, "base64");
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
    assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
  }
  assert.ok(Buffer.byteLength(html) < 1_000_000, "small snapshots keep artwork under a 1 MB page budget");
  assert.match(html, /data-skin="starry"/);
  assert.doesNotMatch(html, /https?:\/\/|src="assets\//);
});

test("renders a self-contained interactive document", () => {
  const main = branch("main", "A");
  const commits = [
    commit("A", ["B"], { refs: [main], subject: "Open the station" }),
    commit("B"),
  ];
  const repo = history(commits, [main]);
  const html = renderMetroHtml(repo, createMetroLayout(commits), {
    title: "Sample line",
    theme: "auto",
    privacy: "standard",
  });
  assert.match(html, /^<!doctype html>/);
  assert.match(html, /id="metro-map"/);
  assert.match(html, /id="search-input"/);
  assert.match(html, /Open the station/);
  assert.match(html, /Content-Security-Policy/);
  assert.doesNotMatch(html, /https?:\/\//);
});

test("escapes untrusted Git text in markup and embedded JSON", () => {
  const malicious = "</script><img src=x onerror=alert(1)>";
  const commits = [commit("A", [], { subject: malicious, authorName: "<b>Alice</b>" })];
  const html = renderMetroHtml(history(commits), createMetroLayout(commits), {
    title: malicious,
    theme: "light",
    privacy: "standard",
  });
  assert.doesNotMatch(html, /<img src=x/);
  assert.doesNotMatch(html, /<b>Alice<\/b>/);
  assert.match(html, /\\u003c\/script\\u003e/);
  assert.equal(escapeHtml("<&\"'"), "&lt;&amp;&quot;&#39;");
});

test("never embeds emails and strict mode aliases author names", () => {
  const commits = [commit("A", [], { authorName: "Alice", authorEmail: "private@example.test" })];
  const standard = renderMetroHtml(history(commits), createMetroLayout(commits), {
    title: "Standard",
    theme: "auto",
    privacy: "standard",
  });
  const strict = renderMetroHtml(history(commits), createMetroLayout(commits), {
    title: "Strict",
    theme: "auto",
    privacy: "strict",
  });
  assert.match(standard, /Alice/);
  assert.doesNotMatch(standard, /private@example\.test/);
  assert.doesNotMatch(strict, /Alice/);
  assert.match(strict, /Contributor 1/);
});
