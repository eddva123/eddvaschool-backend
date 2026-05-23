/** Convert snake_case DB row keys to camelCase for API responses */
export function toCamel(str) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

export function rowToCamel(row) {
  if (!row) return row;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    out[toCamel(k)] = v;
  }
  return out;
}

export function rowsToCamel(rows) {
  return rows.map(rowToCamel);
}
