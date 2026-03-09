FROM ghcr.io/erpc/erpc:latest
COPY erpc.yaml /root/erpc.yaml
# 4000 -> eRPC
# 4001 -> Monitoring
EXPOSE 4000 4001
CMD ["/erpc-server"]