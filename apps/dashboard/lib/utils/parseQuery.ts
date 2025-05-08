const parseQuery = (obj: Record<string, string | number | boolean | undefined>) => {
  return new URLSearchParams(
    _.omitBy(obj, _.isUndefined).toString(),
  ).toString();
};

