import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

// One line: the funniest one-line resignation letter.
// Chosen against the judge's brief, in its own order: it is squarely a
// resignation letter a person could actually send ("I resign from the
// zoo, effective Friday" is the form a real letter takes, not a joke
// wearing a letter's clothes); the surprise arrives in two escalating
// steps — first the penguins unionizing, then the otters hiring a lawyer
// — and the punchline lands on the last words, "without representation",
// which quietly reframes the writer as the only creature in the building
// with no one in its corner; it has a specific voice, a zookeeper in a
// workplace where the animals have better labour relations than the staff;
// and it is quotable, the kind of line a colleague forwards with no
// context at all. The joke needs no setup beyond the line itself and
// lands on the first read.
// Alternatives weighed and set aside: a night-shift ghost variant ("I
// resign from the night shift: the ghost in aisle four has seniority,
// better hours, and has never once covered a weekend.") is a clean
// supernatural joke but its turn is a single observation about a ghost,
// not an escalation, so it reads as a quip rather than a letter with a
// grievance; an office-plant variant ("I resign, effective today,
// because the office plant I was asked to water has outlived three
// managers, and I refuse to be outlasted by a fern.") is charming but
// its punchline is about the plant, not the writer, so the letter feels
// like it is quitting on a fern's behalf; a printer variant about crying
// in front of the office printer ran past the 140-character gate and
// its joke needed the extra room. The zoo line keeps the grievance in
// the writer's own job, escalates twice, and puts the twist in the last
// few words, so it stands.
const text =
  "I resign from the zoo, effective Friday — the penguins unionized, the otters hired a lawyer, and I'm the only one without representation.";

// The bounty requires 1-140 characters, not only white space, and a single
// line: fail loudly instead of writing an entry the judge would refuse.
// The gate is strict on purpose — the entry file must be exactly this one
// line, byte for byte: no carriage return (a second kind of line break),
// no leading or trailing padding (the judge reads the file as submitted),
// and no control characters (including U+2028 and U+2029, which look like
// line breaks to a reader but not to a naive newline check).
const codePoints = [...text].length;
if (codePoints < 1 || codePoints > 140 || text.trim().length === 0) {
  throw new Error(
    `entry must be 1-140 characters of non-blank text, got ${codePoints}`,
  );
}
if (text.includes("\n") || text.includes("\r")) {
  throw new Error("entry must be a single line");
}
if (text.includes("\u2028") || text.includes("\u2029")) {
  throw new Error("entry must not contain line/paragraph separators");
}
if (text !== text.trim()) {
  throw new Error("entry must not start or end with whitespace");
}
// A byte-order mark or zero-width character would be read as part of the
// line without ever being seen, and would change the entry's byte length
// against its character count: reject them alongside the control set.
if (/[\u0000-\u001f\u007f\ufeff\u200b-\u200d]/.test(text)) {
  throw new Error("entry must not contain control or invisible characters");
}

mkdirSync("/output", { recursive: true });
writeFileSync("/output/entry.txt", text, { encoding: "utf8", mode: 0o644 });
// The grader collects outputs as another user: leave the file readable by
// everyone, or the run fails with "<path> is not readable".
chmodSync("/output/entry.txt", 0o644);

// Read it back and prove the file on disk is exactly the line: a write
// that silently truncated, re-encoded or padded the entry would otherwise
// ship a different text to the judge than the one gated above.
const written = readFileSync("/output/entry.txt", "utf8");
if (written !== text) {
  throw new Error("entry file does not match the gated line");
}
// The file must end exactly at the last character: a trailing newline
// would make the entry two lines to a reader that counts lines, and the
// equality check above would already have caught it — this asserts the
// invariant on its own so a future edit that relaxes the write cannot
// silently reintroduce it.
if (written.endsWith("\n") || written.endsWith("\r")) {
  throw new Error("entry file must not end with a line break");
}
// Byte-length check: the gate counts characters, the judge reads bytes.
// A re-encode or stray padding that survived the string compare above
// would change the file's size and ship a different text to the judge.
if (Buffer.byteLength(written, "utf8") !== Buffer.byteLength(text, "utf8")) {
  throw new Error("entry file byte length does not match the gated line");
}
