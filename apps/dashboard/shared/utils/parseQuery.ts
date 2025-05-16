import _ from "lodash";

/**
 * Converts an object to a URL query string, filtering out undefined values
 * 
 * Examples:
 * - parseQuery({userAddress: "0x", foo: "bar"}) => "userAddress=0x&foo=bar"
 * - parseQuery({userAddress: undefined, foo: "bar"}) => "foo=bar"
 * - parseQuery({userAddress: undefined}) => ""
 * 
 * @param obj - Object to convert to query string
 * @returns Query string without the leading "?" (empty string if all values are undefined)
 */
export const parseQuery = (
  obj: Record<string, string | number | boolean | undefined>,
): string => {
  // Filter out undefined values
  const filteredObj = _.omitBy(obj, _.isUndefined);
  
  // If the object is empty after filtering, return an empty string
  if (_.isEmpty(filteredObj)) {
    return "";
  }
  
  // Convert to URLSearchParams format
  const params = new URLSearchParams();
  
  // Add each key-value pair to the params
  Object.entries(filteredObj).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, String(value));
    }
  });
  
  return params.toString();
};
