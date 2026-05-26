FROM ghcr.io/erpc/erpc:latest
ARG ERPC_CONFIG=erpc.dev.yaml
COPY ${ERPC_CONFIG} /root/erpc.yaml
# 4000 -> eRPC
# 4001 -> Monitoring
EXPOSE 5000 4000 4001
CMD ["/erpc-server"]
