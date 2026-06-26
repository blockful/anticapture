# No-op image for PR preview environments.
#
# The docs and mcp-server builds fetch the Gateful OpenAPI spec from a URL at
# build time (see packages/anticapture-client/src/gateful-openapi-spec.ts). In
# an ephemeral PR preview, Gateful isn't live when these build, so the fetch
# 404s and the build fails. These services aren't used in PR previews anyway —
# their railway.json points the `pr` environment build here so it succeeds
# without touching Gateful, and the deploy is a NOOP.
FROM busybox:1.37
CMD ["echo", "NOOP"]
