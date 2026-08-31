import assert from "node:assert/strict";
import test from "node:test";
import { createMetroLayout } from "../src/layout.js";
import { escapeHtml, renderMetroHtml } from "../src/render.js";
import { branch, commit, history } from "./helpers.js";

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
