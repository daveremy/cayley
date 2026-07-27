// The error hierarchy, in a leaf module that imports nothing.
//
// Placement matters. The obvious home for DomainError would be commands.ts, but
// commands.ts imports load.ts, and load.ts's validation errors need to extend
// DomainError — so that arrangement is circular, and ESM class-extends across a
// cycle fails in ways that are hard to read. Living here, both can depend on it
// and nothing depends back.
//
//   errors.ts  ← nothing
//     ↑    ↑
//   load  commands
//            ↑
//           cli
//
// The split is by WHOSE FAULT it is, which is what an exit code communicates:
//
//   DomainError  → exit 1 — the command was well-formed; the operation failed
//   UsageError   → exit 2 — the invocation itself was wrong
//
// `cayley show C99` is a perfectly good command. The group is simply not there.
// That is a domain failure, not a typo in the syntax.

/** The command was understood. Carrying it out did not work. Exit 1. */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

/** No group by that name or alias. */
export class UnknownGroupError extends DomainError {
  known: string[];

  constructor(asked: string, known: string[]) {
    super(`no group called "${asked}"`);
    this.name = "UnknownGroupError";
    this.known = known;
  }
}

/** That element is not in this group. */
export class UnknownElementError extends DomainError {
  constructor(element: string, groupName: string, elements: string[]) {
    super(`"${element}" is not an element of ${groupName} — it has ${elements.map((e) => `"${e}"`).join(", ")}`);
    this.name = "UnknownElementError";
  }
}

/** One thing wrong with one group file. */
export type Issue = { phase: number; message: string };

/** This file is not a group. */
export class GroupValidationError extends DomainError {
  file: string;
  issues: Issue[];

  constructor(file: string, issues: Issue[]) {
    super(`${file}: ${issues.length} problem(s)\n${issues.map((i) => `  ✗ ${i.message}`).join("\n")}`);
    this.name = "GroupValidationError";
    this.file = file;
    this.issues = issues;
  }
}

/**
 * One or more files in the library are not groups.
 *
 * The easiest of these to forget and the likeliest to fire: every command calls
 * loadLibrary(), so a single bad file in groups/ becomes the failure mode for
 * the whole CLI. It must be a DomainError, or it escapes as a stack trace.
 */
export class LibraryValidationError extends DomainError {
  failures: GroupValidationError[];

  constructor(failures: GroupValidationError[]) {
    super(`${failures.length} file(s) failed validation:\n\n${failures.map((f) => f.message).join("\n\n")}`);
    this.name = "LibraryValidationError";
    this.failures = failures;
  }
}

/** Two identifiers normalise alike but name different groups. */
export class AmbiguousNameError extends DomainError {
  constructor(normalised: string, claimants: string[]) {
    super(
      `"${normalised}" is ambiguous — it could mean ${claimants.map((c) => `"${c}"`).join(" or ")}. ` +
        `Rename one of them, or ask for the exact name.`,
    );
    this.name = "AmbiguousNameError";
  }
}

/** You typed the command wrong. Exit 2. */
export class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsageError";
  }
}
