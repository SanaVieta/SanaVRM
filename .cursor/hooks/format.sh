#!/bin/bash
# Formats a file the agent just wrote, using this repo's Biome config.
# Notification hook: always exit 0.
# Do not format afterTabFileEdit. Tab writes into the open editor buffer;
# rewriting the file on disk makes the next save fail because the file is newer.

input=$(cat)

parsed=$(printf '%s' "$input" | node -e '
let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  raw += chunk;
});
process.stdin.on("end", () => {
  try {
    const parsed = JSON.parse(raw);
    const eventName = typeof parsed.hook_event_name === "string" ? parsed.hook_event_name : "";
    const filePath = typeof parsed.file_path === "string" ? parsed.file_path : "";
    process.stdout.write(`${eventName}\n${filePath}`);
  } catch {
    // Malformed hook input should not block the edit.
  }
});
')

event_name=$(printf '%s' "$parsed" | sed -n '1p')
file_path=$(printf '%s' "$parsed" | sed -n '2p')

if [[ "$event_name" == "afterTabFileEdit" ]]; then
  exit 0
fi

if [[ -z "$file_path" || ! -f "$file_path" ]]; then
  exit 0
fi

script_dir=$(cd "$(dirname "$0")" && pwd)
repo_root=$(cd "$script_dir/../.." && pwd)

case "$file_path" in
  "$repo_root"/*) ;;
  *) exit 0 ;;
esac

case "$file_path" in
  */node_modules/* | */.next/* | */dist/* | */build/*) exit 0 ;;
esac

biome_bin="$repo_root/node_modules/.bin/biome"
if [[ ! -x "$biome_bin" ]]; then
  exit 0
fi

"$biome_bin" format --write --files-ignore-unknown=true "$file_path" >/dev/null 2>&1 || true
exit 0
