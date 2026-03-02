fs";
import path = 0, maxDepth = 6) {
  if (depth Paste this codeimport fs from " from "path";

function walk(dir, depth > maxDepth) return;

  const files(dir);

  for (const file of files) {
 = path.join(dir stat = fs.statSync(fullPath);

    console.log("  ". " + file);

    = fs.readdirSync    const fullPath, file);
    constrepeat(depth) + "- if (stat.isDirectory()) {
      walk(fullPath, depth(".", 0, 6);
