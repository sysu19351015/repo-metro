export type Theme = "auto" | "light" | "dark";
export type PrivacyMode = "standard" | "strict";

export interface GitCommit {
  readonly hash: string;
  readonly shortHash: string;
  readonly parents: readonly string[];
  readonly authorName: string;
  readonly authorEmail: string;
  readonly authoredAt: string;
  readonly subject: string;
  readonly refs: readonly GitRef[];
}

export interface GitRef {
  readonly fullName: string;
  readonly name: string;
  readonly kind: "branch" | "remote" | "tag";
  readonly target: string;
}

export interface RepositoryHistory {
  readonly name: string;
  readonly root: string;
  readonly head: string;
  readonly headHash: string;
  readonly commits: readonly GitCommit[];
  readonly refs: readonly GitRef[];
  readonly truncated: boolean;
  readonly maxCommits: number;
}

export interface PositionedCommit extends GitCommit {
  readonly lane: number;
  readonly row: number;
  readonly x: number;
  readonly y: number;
  readonly isMerge: boolean;
}

export interface MetroEdge {
  readonly from: string;
  readonly to: string;
  readonly fromLane: number;
  readonly toLane: number;
}

export interface MetroLayout {
  readonly commits: readonly PositionedCommit[];
  readonly edges: readonly MetroEdge[];
  readonly laneCount: number;
  readonly width: number;
  readonly height: number;
  readonly graphStartX: number;
  readonly labelStartX: number;
  readonly rowHeight: number;
  readonly laneWidth: number;
  readonly continuationLanes: readonly number[];
}

export interface RenderOptions {
  readonly title: string;
  readonly theme: Theme;
  readonly privacy: PrivacyMode;
}
