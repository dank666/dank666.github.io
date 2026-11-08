#!/bin/zsh
# Double-click in Finder to open the paper tool (论文库). Closing this window stops it.
cd "${0:A:h}/../.." || exit 1
command -v node >/dev/null || export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
exec node tools/papers/server.mjs
