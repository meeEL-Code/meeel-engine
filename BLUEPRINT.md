# meeEL engine 4.0 — blueprint

*Pure imperative natural english. No brackets. No colons. No symbols.*

*by Ocide*

---

## 0. Philosophy

meeEL is not a programming language. It is a director's language.

The user does not write code. The user gives orders.
The engine obeys — by reading meaning, not by matching patterns.

**One sentence equals one order.**
**One order equals one meaning.**
**No symbol is ever required.**

---

## 1. The Four Statement Types

Every line in meeEL is one of four orders.

| # | Statement | Purpose | Example |
|---|---|---|---|
| 1 | create | Bring a new block into existence | create a player named hero |
| 2 | set | Change a property of a block | set health to one hundred |
| 3 | when | Begin an event block | when hero touches boss |
| 4 | action | Do something inside a when | reduce health of boss by ten |

Every statement is a full english sentence.
Verb first. Natural phrasing. Period optional.

---

## 2. Block Boundaries

Brackets are gone. Boundaries are determined by starters.

A new block starts when the line begins with:

- create
- make
- build
- add
- define
- when

When a new starter is seen, the previous block is closed.

Example:

```
create a page
set background to black
set name to Home

create a player named hero
set health to one hundred
set color to blue

when hero touches boss
reduce health of boss by ten
play sound hit
```

Reading:

- Lines 1-3 belong to the page block
- Lines 4-6 belong to the hero block
- Lines 7-9 belong to the event block

No blank lines required. No indentation required. Order is the only rule.

---

## 3. Type Detection

When a create-statement is parsed, the engine finds the block TYPE
by looking up words in a VOCABULARY (WIDGET_ROLES).

User may write the type word in any position:

    create a player named hero       →  type: player
    create xbtn called fire          →  type: btn   (suffix match)
    create a red enemy named boss    →  type: enemy

If no vocabulary word is found, the LAST word is treated as the type.

The remaining words become the MODIFIER.

Reference name = type + '-' + modifier (or just type).

    create a player named hero       →  refName: player-hero
    create xbtn called fire          →  refName: btn-x
    create enemy                     →  refName: enemy

---

## 4. Reference Naming

By default, the engine derives a reference name from type + modifier.

User may override it with a call-clause:

    create a page
    call this "home"              →  refName: home

    create a player named hero
    call this "p1"                →  refName: p1

The call-clause must appear right after the create-statement.

Supported phrasings (all equivalent):

    call this "home"
    call it "home"
    name this "home"
    refer to this as "home"

---

## 5. Nesting — Placing a Block Inside Another

When creating a block, the user may specify its parent.
All these phrasings mean the same thing:

    create a button named play inside main
    create a button named play in main
    create a button named play under main
    main contains a button named play

Backend: parent = main, child = button-play

If no parent is specified, the block becomes a sibling of
the previous create-statement (top-level by default).

Nested blocks may themselves contain further nesting:

    create a page
    create a card named menu inside page
    create a button named play inside menu

Reading:
    page
    ├── card-menu
    │   └── button-play

---

## 6. Condition Grammar — after 'when'

The user writes when followed by a natural English condition.
The engine extracts three parts, regardless of word order:

    Subject   — who or what
    Relation  — what happens
    Value     — with what / at what value

Examples (order-agnostic):

    when hero touches boss           →  Subject: hero, Relation: touches, Value: boss
    when health is 0                 →  Subject: health, Relation: is, Value: 0
    when at center of x-card         →  Subject: x-card, Relation: at-center, Value: -
    when button is clicked           →  Subject: button, Relation: clicked, Value: -
    when score reaches one hundred   →  Subject: score, Relation: reaches, Value: 100

The engine does NOT match specific phrases.
It matches MEANINGS via the relation vocabulary (Section 7).

---

## 7. Relation Vocabulary

This is the language's DICTIONARY — not a hardcode.
Every language needs a vocabulary to understand meaning.

Presence & Contact:
    touches, meets, hits, collides, contains, inside, near, at, on

State & Comparison:
    is, becomes, equals, reaches, falls, rises

Time & Sequence:
    starts, ends, after, before, every, passes, while

Input Actions:
    clicked, pressed, tapped, swiped, dragged, held, released

Change & Movement:
    changes, increases, decreases, moves, enters, leaves

Threshold:
    exceeds, below, above, at-least, at-most

Relation words are used by the parser to identify the ACTION
between Subject and Value. The rest of the words are data.

---

## 8. Action Vocabulary (inside a when block)

Actions are English commands. Verb first. Target and value after.

Math & State:
    set <target> to <value>
    give <target> <value>
    reduce <target> by <value>
    increase <target> by <value>
    cut <target> by <value>

Creation & Removal:
    create <block>
    destroy <target>
    remove <target>

Movement:
    move <target> <direction>
    slide <target> to <position>
    jump <target>

Visual:
    show <target>
    hide <target>
    flash <target>
    fade in <target>
    fade out <target>

Media & Flow:
    play sound <name>
    stop game
    pause game
    resume game

Synonyms are resolved by a registry (see Section 10).
No specific verb is enforced.

---

## 9. Custom Actions (define)

The user may define reusable actions:

    define victory
    show text YOU WIN
    play sound win
    stop game

Then invoke:

    when hero touches boss
    victory

Define blocks are also closed by the next starter word.

---

## 10. Synonym Registry (Verbs)

Multiple English verbs map to the same action.
User may use any synonym — the engine resolves to the canonical one.

| User may write        | Canonical action |
|---|---|
| create, make, build, add | create |
| set, give, assign        | set |
| reduce, cut, lower       | reduce |
| increase, raise, boost   | increase |
| show, display, reveal    | show |
| hide, conceal            | hide |
| remove, destroy, delete  | destroy |
| play, sound             | play |

This registry is vocabulary — not logic hardcoding.

---

## 11. Unresolved Rules — Decided

Numbers:
    Standard digits (100) and English words (one hundred, twenty-five)
    are treated identically. No other language.

Comments:
    Lines starting with # are ignored.
    Lines starting with note: or remark: are also ignored.

Strings:
    Quotes are optional. write text hello == write text "hello"

Nested conditions (and / or):
    when hero touches boss and health of boss is below 50
    Both conditions must be true (logical AND).

Language:
    meeEL 4.0 is ENGLISH ONLY. No multilingual parsing.
    This keeps the engine fast, predictable, and universal.

---

## 12. What This Engine Never Does (Forbidden)

The engine will NEVER contain:

  1. Hardcoded block names (if type == "joystick" ...)
  2. Hardcoded word lists for specific phrases
  3. Hardcoded action handlers for specific user names
  4. Any logic keyed on a specific user-chosen word

All logic is derived from:
  - Vocabulary dictionaries (meaning)
  - Structural roles (entity, container, button, controller)
  - Sentence grammar (verb + target + value)

---

## 13. Conclusion

meeEL 4.0 is a director's language for building apps and games
by writing pure imperative English. No symbols. No brackets.
No colons. No code.

One sentence.
One order.
One meaning.

*End of Blueprint v4.0*

*Built by Ocide.*
