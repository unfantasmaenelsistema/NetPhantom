// Gemini's "application/json" response mode constrains the overall shape but
// not every character inside long string fields (provisionScript/dockerfile/
// dockerCompose routinely contain shell syntax like \$PATH or \` command
// substitution). A bare backslash followed by something that isn't a valid
// JSON escape char breaks JSON.parse with "Bad escaped character" and
// silently falls back to the offline catalog - reproduced live while
// generating an Alien-themed scenario. Escaping that backslash to \\ keeps
// the literal character intact instead of discarding the whole generation.
const VALID_ESCAPE_CHARS = '"\\/bfnrtu';

export function repairInvalidJsonEscapes(text: string): string {
  // Matching and replacing a bare `\\(?!validSet)` independently per position
  // double-escapes valid pairs too: the lookahead on the *first* backslash of
  // a legit `\\` correctly holds back, but the *second* backslash then gets
  // re-examined on its own against the following character and wrongly
  // "repaired". Consuming the backslash together with whatever follows it
  // avoids re-visiting that second character as a standalone backslash.
  return text.replace(/\\(.)/gs, (match, ch: string) =>
    VALID_ESCAPE_CHARS.includes(ch) ? match : '\\\\' + ch
  );
}
