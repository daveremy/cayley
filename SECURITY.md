# Security

## Reporting

Email **dave@innerstacklabs.com**. Please do not open a public issue for anything
you think is genuinely exploitable.

Include what you did, what happened, and what you expected. A reproduction is
worth more than a severity rating.

**No bounty, and response is best-effort.** This is one person and there is no
on-call rotation. Expect an acknowledgement within a week. If something is
actually broken it gets fixed quickly; a report that sits unanswered for a
fortnight has been lost, not ignored, and a second email is welcome.

## Supported versions

`main`. There are no releases yet, so there is nothing to back-port to. Fixes
land on `main` and that is the whole story.

## What the attack surface actually is

**Today: almost nothing.** The project is a CLI and a library of JSON files. It
reads local files you already have on disk, has zero dependencies — so no
transitive supply chain — runs no server, opens no socket, stores no credentials,
and accepts no remote input. The realistic bug classes are a crash and a wrong
answer. A wrong answer matters enormously here — but it is a correctness bug, not
a security one. Report those as ordinary issues.

**Tomorrow: `POST /api/v1/validate`.** The planned web API (see
[`docs/PRD-webapp.md`](docs/PRD-webapp.md) §7.4) is the first thing that will
accept a stranger's input, and it is the one endpoint that must actually run
code rather than serve a cached file. **It does not exist yet.** When it ships,
that is where to look.

One constraint is worth stating in advance, because it is by design: the
associativity check is a triple loop over the elements, and edge functions get a
fixed CPU budget per invocation. An order-24 group is about 14,000 comparisons
and fine. An order-168 group is 4.7 million and is not. Unbounded input is
therefore a denial of service by arithmetic alone, which is why element count and
payload size will be capped at the endpoint. Once it ships, a way around that cap
is a real report and we would like to hear it.

## Out of scope

- Bugs in the mathematics. Those are correctness issues and belong in the public
  tracker — the validator refusing a genuine group, or accepting a non-group, is
  a serious bug and an ordinary one.
- Anything requiring an attacker to already have write access to your filesystem.
  A malicious `.group.json` you chose to run `cayley check` on is a file you
  chose to run `cayley check` on.
- Missing hardening on an endpoint that has not been built.
