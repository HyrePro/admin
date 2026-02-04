import fs from "node:fs";
import path from "node:path";

const commitMsgFile = process.argv[2];
if (!commitMsgFile) {
  process.exit(0);
}

const commitMessage = fs.readFileSync(commitMsgFile, "utf8").split("\n")[0].trim();
if (!commitMessage || commitMessage.startsWith("Merge ")) {
  process.exit(0);
}

const dataPath = path.resolve(process.cwd(), "src/data/release-notes.json");
const raw = fs.readFileSync(dataPath, "utf8");
const data = JSON.parse(raw);

const releases = Array.isArray(data.releases) ? data.releases : [];
const currentVersion = releases[0]?.version ?? "0.0.0";

const parseVersion = (value) => {
  const parts = value.split(".").map((item) => Number(item));
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0,
  };
};

const bumpVersion = (value, type) => {
  const { major, minor, patch } = parseVersion(value);
  if (type === "major") {
    return `${major + 1}.0.0`;
  }
  if (type === "minor") {
    return `${major}.${minor + 1}.0`;
  }
  return `${major}.${minor}.${patch + 1}`;
};

const detectType = (message) => {
  const lower = message.toLowerCase();
  if (lower.startsWith("major:")) return "major";
  if (lower.startsWith("feat:") || lower.startsWith("feature:") || lower.startsWith("func:") || lower.startsWith("functional:")) {
    return "minor";
  }
  return "patch";
};

const stripPrefix = (message) => {
  return message.replace(/^(major|feat|feature|func|functional|ui|chore|fix|refactor):\s*/i, "").trim();
};

const bumpType = detectType(commitMessage);
const nextVersion = bumpVersion(currentVersion, bumpType);
const summary = stripPrefix(commitMessage) || "Update.";

const typeMap = {
  major: "major",
  minor: "functional",
  patch: "ui",
};

const today = new Date();
const date = today.toISOString().slice(0, 10);

const nextEntry = {
  version: nextVersion,
  date,
  type: typeMap[bumpType] || "ui",
  summary,
  changes: [summary],
};

data.releases = [nextEntry, ...releases];

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + "\n", "utf8");
