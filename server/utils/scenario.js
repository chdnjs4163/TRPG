function parseScenario(raw) {
  if (!raw) return undefined;
  if (Buffer.isBuffer(raw)) {
    try {
      return JSON.parse(raw.toString("utf8"));
    } catch {
      return undefined;
    }
  }
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return undefined;
    }
  }
  if (typeof raw === "object") return raw;
  return undefined;
}

function serializeScenario(input) {
  if (input === undefined) return undefined;
  if (input === null) return null;
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (trimmed.length === 0) return null;
    try {
      JSON.parse(trimmed);
      return trimmed;
    } catch {
      throw new Error("INVALID_SCENARIO");
    }
  }
  if (typeof input === "object") {
    try {
      return JSON.stringify(input);
    } catch {
      throw new Error("INVALID_SCENARIO");
    }
  }
  throw new Error("INVALID_SCENARIO");
}

module.exports = { parseScenario, serializeScenario };
