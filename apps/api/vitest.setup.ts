// JSON.stringify doesn't handle BigInt natively; this patch ensures it serializes as a string
Object.defineProperty(BigInt.prototype, "toJSON", {
  value: function (this: bigint) {
    return this.toString();
  },
  writable: true,
  configurable: true,
});
