import type { GitCommit, MetroEdge, MetroLayout, PositionedCommit } from "./types.js";

const ROW_HEIGHT = 52;
const LANE_WIDTH = 42;
const TOP_PADDING = 48;
const BOTTOM_PADDING = 64;
const GRAPH_START_X = 132;
const LABEL_GAP = 42;
const LABEL_WIDTH = 540;

export function createMetroLayout(commits: readonly GitCommit[]): MetroLayout {
  const active: string[] = [];
  const positioned: PositionedCommit[] = [];
  const emitted = new Set<string>();
  const referenced = new Set<string>();
  let laneCount = 1;

  for (let row = 0; row < commits.length; row += 1) {
    const commit = commits[row];
    if (commit === undefined) continue;
    if (emitted.has(commit.hash)) {
      throw new Error(`Duplicate commit in layout input: ${commit.hash}`);
    }

    let lane = active.indexOf(commit.hash);
    if (lane === -1) {
      if (referenced.has(commit.hash)) {
        throw new Error(
          `Commit order is not child-before-parent near ${commit.shortHash || commit.hash.slice(0, 7)}.`,
        );
      }
      lane = active.length;
      active.push(commit.hash);
    }

    positioned.push({
      ...commit,
      lane,
      row,
      x: GRAPH_START_X + lane * LANE_WIDTH,
      y: TOP_PADDING + row * ROW_HEIGHT,
      isMerge: commit.parents.length > 1,
    });

    const withoutCurrent = active.filter((_, index) => index !== lane);
    const uniqueParents = [...new Set(commit.parents)];
    let insertionIndex = Math.min(lane, withoutCurrent.length);

    for (const parent of uniqueParents) {
      if (parent === commit.hash) {
        throw new Error(`Commit ${commit.shortHash} lists itself as a parent.`);
      }
      if (emitted.has(parent)) {
        throw new Error(
          `Commit order is not child-before-parent near ${commit.shortHash || commit.hash.slice(0, 7)}.`,
        );
      }
      referenced.add(parent);
      if (withoutCurrent.includes(parent)) continue;
      withoutCurrent.splice(insertionIndex, 0, parent);
      insertionIndex += 1;
    }

    active.splice(0, active.length, ...withoutCurrent);
    emitted.add(commit.hash);
    laneCount = Math.max(laneCount, lane + 1, active.length);
  }

  const positionsByHash = new Map(positioned.map((commit) => [commit.hash, commit]));
  const edges: MetroEdge[] = [];
  for (const commit of positioned) {
    for (const parent of new Set(commit.parents)) {
      const parentCommit = positionsByHash.get(parent);
      if (parentCommit === undefined) continue;
      edges.push({
        from: commit.hash,
        to: parent,
        fromLane: commit.lane,
        toLane: parentCommit.lane,
      });
    }
  }

  const labelStartX = GRAPH_START_X + laneCount * LANE_WIDTH + LABEL_GAP;
  return {
    commits: positioned,
    edges,
    laneCount,
    width: Math.max(860, labelStartX + LABEL_WIDTH),
    height: Math.max(280, TOP_PADDING + commits.length * ROW_HEIGHT + BOTTOM_PADDING),
    graphStartX: GRAPH_START_X,
    labelStartX,
    rowHeight: ROW_HEIGHT,
    laneWidth: LANE_WIDTH,
    continuationLanes: active.map((_, lane) => lane),
  };
}
