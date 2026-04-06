import { trace, SpanStatusCode } from "@opentelemetry/api";

const tracer = trace.getTracer("anticapture");

type AnyMethod = (...args: unknown[]) => unknown;

/**
 * Wraps all methods on an object instance with OTel spans.
 * Span names follow the pattern "ClassName.methodName".
 * Async methods are awaited before ending the span; sync methods end immediately.
 */
export function wrapWithTracing<T extends object>(instance: T): T {
  const className = instance.constructor.name;
  const proto = Object.getPrototypeOf(instance);

  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key === "constructor") continue;

    const descriptor = Object.getOwnPropertyDescriptor(proto, key);
    if (!descriptor || typeof descriptor.value !== "function") continue;

    const original = descriptor.value as AnyMethod;
    const spanName = `${className}.${key}`;

    (instance as Record<string, unknown>)[key] = function (
      this: unknown,
      ...args: unknown[]
    ) {
      return tracer.startActiveSpan(spanName, (span) => {
        try {
          const result = original.apply(this, args);
          if (result instanceof Promise) {
            return result
              .then((v) => {
                span.end();
                return v;
              })
              .catch((err: unknown) => {
                span.recordException(err as Error);
                span.setStatus({ code: SpanStatusCode.ERROR });
                span.end();
                throw err;
              });
          }
          span.end();
          return result;
        } catch (err) {
          span.recordException(err as Error);
          span.setStatus({ code: SpanStatusCode.ERROR });
          span.end();
          throw err;
        }
      });
    };
  }

  return instance;
}
