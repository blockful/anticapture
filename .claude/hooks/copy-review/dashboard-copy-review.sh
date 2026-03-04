#!/bin/bash
# Hook: Review dashboard copy before pushing
# Detects dashboard changes and instructs Claude to run a copy review
# using the style guide, framework reference, and review prompt.

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$REPO_ROOT" ]; then
  exit 0
fi

HOOK_DIR="$REPO_ROOT/.claude/hooks/copy-review"
MAIN_BRANCH="dev"
REMOTE="${REMOTE:-origin}"

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
echo "Review the diff against the style guide and framework reference. Report findings in the format specified by the review prompt. If no issues are found, state that explicitly."
exit 1
