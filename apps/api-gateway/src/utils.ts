/**
 * Helper function to convert GraphQL arguments to JavaScript values
 * Handles GraphQL AST nodes like ListValue, StringValue, etc. and converts them to proper JS primitives
 */
export function convertGraphQLArgs(args: any): any {
  if (args === null || args === undefined) {
    return args;
  }

  // Handle arrays (already JavaScript arrays)
  if (Array.isArray(args)) {
    return args.map(convertGraphQLArgs);
  }

  // Handle GraphQL AST nodes
  if (args && typeof args === 'object' && args.kind) {
    switch (args.kind) {
      case 'ListValue':
        return args.values.map((value: any) => convertGraphQLArgs(value));
      
      case 'IntValue':
        return parseInt(args.value, 10);
      
      case 'FloatValue':
        return parseFloat(args.value);
      
      case 'StringValue':
      case 'BooleanValue':
      case 'EnumValue':
        return args.value;
      
      default:
        return args;
    }
  }

  // Handle objects recursively (non-AST objects)
  if (args && typeof args === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(args)) {
      converted[key] = convertGraphQLArgs(value);
    }
    return converted;
  }

  // Return primitive values as-is
  return args;
} 