import assert from "node:assert/strict";
import test from "node:test";
import { createMetroLayout } from "../src/layout.js";
import { commit } from "./helpers.js";

test("lays out a linear history on one lane", () => {
  const layout = createMetroLayout([
    commit("A", ["B"]),
    commit("B", ["C"]),
    commit("C"),
  ]);
  assert.deepEqual(layout.commits.map((item) => item.lane), [0, 0, 0]);
  assert.equal(layout.laneCount, 1);
  assert.equal(layout.edges.length, 2);
  assert.deepEqual(layout.continuationLanes, []);
});

test("reuses a shared ancestor lane after a merge", () => {
  const layout = createMetroLayout([
    commit("M", ["A", "B"]),
    commit("A", ["R"]),
    commit("B", ["R"]),
    commit("R"),
  ]);
  assert.deepEqual(layout.commits.map((item) => item.lane), [0, 0, 1, 0]);
  assert.equal(layout.laneCount, 2);
  assert.equal(layout.edges.length, 4);
  assert.deepEqual(layout.continuationLanes, []);
});

test("does not duplicate a first parent already active from another tip", () => {
  const layout = createMetroLayout([
    commit("X", ["R"]),
    commit("Y", ["R"]),
    commit("R"),
  ]);
  assert.deepEqual(layout.commits.map((item) => item.lane), [0, 1, 0]);
  assert.equal(layout.laneCount, 2);
});

test("supports octopus merges while preserving parent order", () => {
  const layout = createMetroLayout([
    commit("M", ["A", "B", "C"]),
    commit("A", ["R"]),
    commit("B", ["R"]),
    commit("C", ["R"]),
    commit("R"),
  ]);
  assert.deepEqual(layout.commits.map((item) => item.lane), [0, 0, 1, 1, 0]);
  assert.equal(layout.edges.length, 6);
  assert.equal(layout.laneCount, 3);
});

test("marks incomplete lanes when a snapshot is truncated", () => {
  const layout = createMetroLayout([commit("A", ["B"])]);
  assert.deepEqual(layout.continuationLanes, [0]);
});

test("rejects duplicate and non-topological input", () => {
  assert.throws(() => createMetroLayout([commit("A"), commit("A")]), /Duplicate commit/);
  assert.throws(() => createMetroLayout([commit("B"), commit("A", ["B"])]), /child-before-parent/);
  assert.throws(() => createMetroLayout([commit("A", ["A"])]), /lists itself as a parent/);
});

test("produces deterministic coordinates for the same graph", () => {
  const graph = [commit("M", ["A", "B"]), commit("A"), commit("B")];
  assert.deepEqual(createMetroLayout(graph), createMetroLayout(graph));
});
