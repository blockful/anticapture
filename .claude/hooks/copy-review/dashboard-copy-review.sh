#!/bin/bash
# Hook: Review dashboard copy before pushing
# Detects dashboard changes and instructs Claude to run a copy review
# using the style guide, framework reference, and review prompt.
#
# Flow:
#   1st push attempt → blocks, outputs review context for Claude to review
#   Claude reviews → if clean, asks user for approval → creates marker file
#   2nd push attempt → marker found → allows push, cleans up marker

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$REPO_ROOT" ]; then
  exit 0
fi

HOOK_DIR="$REPO_ROOT/.claude/hooks/copy-review"
MARKER_FILE="$HOOK_DIR/.copy-review-approved"
MAIN_BRANCH="dev"
REMOTE="${REMOTE:-origin}"

# If a previous review was approved, allow the push and clean up
if [ -f "$MARKER_FILE" ]; then
  rm -f "$MARKER_FILE"
  exit 0
fi

# Get the merge base with the main branch
MERGE_BASE=$(git merge-base "$REMOTE/$MAIN_BRANCH" HEAD 2>/dev/null)

if [ -z "$MERGE_BASE" ]; then
  exit 0
fi

# Check for dashboard changes between merge base and HEAD
DASHBOARD_CHANGES=$(git diff --name-only "$MERGE_BASE" HEAD -- apps/dashboard/)

if [ -z "$DASHBOARD_CHANGES" ]; then
  exit 0
fi

# Get the actual diff content for changed dashboard files
DASHBOARD_DIFF=$(git diff "$MERGE_BASE" HEAD -- apps/dashboard/)

# Load reference documents
STYLE_GUIDE=$(cat "$HOOK_DIR/copy-style-guide.md" 2>/dev/null)
FRAMEWORK_REF=$(cat "$HOOK_DIR/framework-reference.md" 2>/dev/null)
REVIEW_PROMPT=$(cat "$HOOK_DIR/review-prompt.md" 2>/dev/null)

echo "DASHBOARD COPY REVIEW REQUIRED"
echo ""
echo "The following dashboard files have changed:"
echo "$DASHBOARD_CHANGES"
echo ""
echo "Before pushing, perform a copy review of the diff below using these references:"
echo ""
echo "=== REVIEW PROMPT ==="
echo "$REVIEW_PROMPT"
echo ""
echo "=== COPY STYLE GUIDE ==="
echo "$STYLE_GUIDE"
echo ""
echo "=== FRAMEWORK REFERENCE ==="
echo "$FRAMEWORK_REF"
echo ""
echo "=== DASHBOARD DIFF ==="
echo "$DASHBOARD_DIFF"
echo ""
echo "=== INSTRUCTIONS ==="
echo "Review the diff against the style guide and framework reference. Report findings in the format specified by the review prompt."
echo ""
echo "After your review:"
echo "- If NO issues are found: ask the user for approval to push. If they approve, create the marker file at '$MARKER_FILE' and retry the git push command."
echo "- If issues ARE found: report all findings to the user and ask them to fix the issues before pushing. Do NOT create the marker file."
exit 1
