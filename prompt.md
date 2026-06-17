# Research: Build an Intelligent Arabic Discord AI Manager

## Goal

Research how to upgrade this Discord bot from a weak command bot into a smart Arabic AI assistant for Discord server management.

Do NOT implement yet.
Research only.

The bot should understand user intent, not memorize fixed phrases.
The bot should understand Discord concepts, permissions, roles, channels, members, moderation, and multi-step requests.
The bot should plan actions safely, execute the right tools, remember context, and reply naturally in Arabic.

This research must inspect:
- Talk.md
- the full codebase
- current Discord.js / Discord API behavior when needed
- best architecture for AI assistants that manage tools and permissions

---

## Main Problem

The current bot is bad because it behaves like a dumb tool executor.

It often:
- misses parts of the user’s request
- ignores context
- executes only one step from a multi-step request
- gives generic replies
- does not explain what changed
- fails to understand Arabic naturally
- fails to reason about Discord permissions
- forgets channels, roles, and members
- fails to resolve references like “the room I just made”
- exposes raw internal function/tool syntax
- does not apologize or recover when corrected
- does not know when to ask clarification
- does not safely handle destructive actions

Research the real root causes.

Do not fix this with only more regex.
Do not fix this with only a longer prompt.
Do not fix this by hardcoding a few Arabic words.

Design a proper intelligence layer.

---

## Required Research Areas

### 1. AI Assistant Architecture

Research how this bot should be structured as an AI tool-using assistant.

Cover:
- intent understanding
- entity extraction
- semantic interpretation
- multi-step planning
- tool selection
- tool execution verification
- tool result summarization
- memory and context
- clarification questions
- confirmation gates for destructive actions
- error recovery
- emotional tone handling
- Arabic dialect handling

The bot should convert a user message into a structured plan before executing tools.

Example structure:

```ts
{
  userIntent: "manage_discord_server",
  actions: [
    {
      type: "delete_channels",
      scope: "all_except",
      preserve: ["channel named الو"],
      destructive: true
    },
    {
      type: "create_structure",
      structureType: "simple_store"
    }
  ],
  missingInformation: [],
  requiresConfirmation: true
}

This structure is only an example.
Research the best shape based on the codebase.

2. Discord Permission Intelligence

Research Discord permissions deeply and accurately.

The bot must understand:

guild permissions
role permissions
channel permission overwrites
category inheritance
text channel permissions
voice channel permissions
forum/announcement permissions if supported
ViewChannel
SendMessages
ReadMessageHistory
Connect
Speak
Stream / screen share
ManageChannels
ManageRoles
KickMembers
BanMembers
ModerateMembers / timeout
Administrator
@everyone behavior
role hierarchy limits
bot permission limits

Research how to translate natural user requests into correct Discord permission operations.

The bot must understand concepts like:

visible but locked
visible but cannot enter
visible but cannot talk
hidden except for a role
public channel
private channel
locked chat
open chat
voice room where users can speak and stream
category permissions inherited by child channels
role-specific access

The research must identify whether the current permission tools are expressive enough or need redesign.

3. Arabic Understanding

Research how to make the bot understand Arabic semantically.

Do not rely only on exact phrases.

The bot should handle:

Saudi dialect
casual Arabic
misspellings
mixed Arabic/English
Discord slang
short angry commands
incomplete commands
references to previous entities
corrections
multi-intent requests

Research a hybrid system:

Arabic normalization
intent taxonomy
entity extraction
fuzzy matching
semantic LLM interpretation
deterministic safety checks
clarification when ambiguous

The goal is not to recognize one phrase.
The goal is to understand the meaning.

4. Talk.md Failure Analysis

Read Talk.md completely.

For every user/bot exchange, identify:

what the user actually wanted
what Discord objects were mentioned
what operation was required
whether the request was single-step or multi-step
what the bot did
what the bot missed
whether the bot should have asked clarification
whether the bot should have confirmed before a dangerous action
whether the bot remembered context
whether the bot gave a useful reply
what code path caused the failure

For each failure, provide:

Talk.md turn or line
user message
bot reply
correct interpretation
actual behavior
missing step
root cause
involved files/functions
priority P0/P1/P2/P3
recommended fix

Keep the report professional.

5. Codebase Research

Inspect the whole codebase and map the architecture.

Find the files/functions responsible for:

Discord message handling
AI request creation
system prompt generation
model/provider calls
tool schemas
tool execution
tool result replies
channel creation/deletion
role creation/editing
permission editing
moderation actions
ban/kick/timeout
member/channel/role resolution
Arabic NLP
compound request planning
memory/context
entity tracking
deterministic replies
function tag normalization
logging
tests

For every important part:

explain what it does now
explain why it fails
explain what should change
Desired Future Behavior

The improved bot should work like this:

Simple action

User asks to ban a member.

Bot should:

understand this is moderation
resolve the member
ask clarification if multiple matches exist
check bot permissions and role hierarchy
execute ban only when safe
reply with the member name and result
Compound server management

User asks to clean the server, preserve something, and create a new structure.

Bot should:

identify all requested actions
separate destructive and non-destructive actions
ask confirmation if needed
execute in safe order
verify final server state
reply with what was deleted, preserved, created, skipped, or failed
Permission request

User asks to make a room visible but locked.

Bot should:

resolve the target room from memory or current server state
infer whether it is text or voice
apply the correct permission overwrites
explain the final permission behavior clearly
Correction

User says the bot misunderstood.

Bot should:

acknowledge the mistake
restate the corrected meaning
fix the action if possible
verify the result
avoid repeating the same mistake
Architecture To Propose

Research and design these layers:

A. Intent Understanding Layer

Converts user text into structured intents.

Should support:

multiple intents in one message
destructive action detection
ambiguity detection
entity references
Arabic paraphrases
confidence scores
B. Entity Resolution Layer

Resolves:

channels
categories
roles
members
recently created objects
“that room”
“the private room”
“the one I made earlier”

Should use:

Discord API state
memory
fuzzy matching
recent entities
clarification when needed
C. Discord Permission Planner

Central place for permission logic.

It should know:

what permissions are needed
how overwrites work
what tool calls are required
how to verify results
D. Operation Planner

Turns intents into ordered tool steps.

Should handle:

create then configure
delete except preserved targets
category then child channels
role then permission assignment
moderation with confirmation
verification after changes
E. Safety Layer

Requires confirmation for:

deleting many channels
deleting categories
banning members
mass role changes
overwriting category permissions
destructive server-wide actions
F. Reply Layer

Never reply with generic messages only.

Bad:
"تم إنشاء 3 قناة بنجاح."

Good:
"تم إنشاء 3 قنوات: عام، طلبات، خاص. وضبطت خاص بحيث الكل يشوفه لكن ما يقدر يدخل."

Replies should include:

names
counts
actions completed
actions skipped
failures
final state summary
clarification questions when needed
G. Test Layer

Research tests for:

Arabic paraphrases
multi-step commands
permission scenarios
member moderation
entity memory
correction handling
angry user handling
raw function tag leakage
tool result summaries
destructive confirmations

Tests should use many paraphrases, not one exact phrase.

Key Research Questions

Answer these clearly:

Why does the bot miss parts of multi-step Arabic requests?
Why does it give generic replies?
Why does it expose internal function syntax?
Why does it fail to remember recent channels/roles/members?
Why does it fail to resolve references like “the private room”?
Why does it fail to understand Discord permission meaning?
Why does it fail on moderation requests like ban/kick/timeout?
Is the current tool schema good enough?
Should permission handling be centralized?
Should Arabic NLP be regex, LLM, or hybrid?
What should be deterministic and what should be AI-driven?
How should the bot verify all requested subtasks completed?
When should the bot ask clarification?
When should the bot require confirmation?
What implementation phases should come next?
Output Required

Create a detailed research artifact with:

Executive summary
Top root causes
Talk.md failure table
Discord permission research summary
Arabic intent understanding design
Current architecture map
Proposed architecture
Exact files/functions to modify
P0/P1/P2/P3 fixes
Testing strategy
Implementation phases
User decisions needed before coding

Do not implement.

End by recommending the next command, preferably:

/skill:blueprint <research-file>