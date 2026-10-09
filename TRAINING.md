# meeEL Universal Engine Training Sheet

*A rule-based English language. No keywords. No shortcuts. Just meaning.*

**by Ocide**

---

## 1. The Philosophy

meeEL reads English. Not patterns — meanings.

If a rule is defined, meeEL can parse any expression that follows the rule.
We don't pre-write examples. We define rules. Users write freely.

---

## 2. Rule — Comments

A line that starts with `#` and ends with `.` is a comment.

Ignored completely.

---

## 3. Rule — Colors

A `#` followed by 3, 4, 6, or 8 hex digits is a color.

Hex codes do **not** end with `.` — that is how meeEL tells them apart from comments.

---

## 4. Rule — Blocks

A block is written inside `[ ]`.

The name before `[` describes what the block is.

---

## 5. Rule — Reference Names

A block name has two parts: **type** and **modifier**.

**Rule:** last word = type, first word(s) = modifier.
**Reference name** = `type-modifier`.

Examples:

- `enemy [ ... ]`        → reference: `enemy`
- `x enemy [ ... ]`      → reference: `enemy-x`
- `red enemy [ ... ]`    → reference: `enemy-red`
- `main screen [ ... ]`  → reference: `screen-main`

The reference name is how you mention this block later.

---

## 6. Rule — Properties

Two forms are equal:

Use whichever reads better.

---

## 7. Rule — Events

An event starts with `when`, `every`, or `if`.

Both work. `:` for indent-style, `[ ]` for block-style.

---

## 8. Rule — Actions

Every action is an English sentence.

No special syntax. Just English.

---

## 9. Rule — Number Words

Numbers can be written as words:

- one = 1
- two = 2
- three = 3
- four = 4
- five = 5
- six = 6
- seven = 7
- eight = 8
- nine = 9
- ten = 10
- twenty = 20
- fifty = 50
- hundred = 100

---

## 10. Rule — Spacing

Multiple spaces, tabs, mixed indentation — all ignored.
meeEL looks only at structure, not at spacing.

---

## 11. Rule — No Reserved Words

Any word can be a name.
`player`, `when`, `if` — all usable as variable names if context allows.

meeEL decides meaning from **position and pattern**, not from a fixed keyword list.

---

## Vocabulary Guide

These words carry meaning when used in the right context.

### Positions

top, bottom, left, right, center, middle
top left, top right, bottom left, bottom right

### Shapes

circle, square, triangle, star, heart, hexagon, diamond

### Faces

smiley, angry, sad, cool, wink, neutral, surprised

### Colors

red, blue, green, gold, orange, purple, pink, gray
white, black, dark blue, light

### Directions

up, down, left, right, towards, away

### Verbs

add, reduce, increase, set, move, jump, destroy
spawn, create, play, show, hide, flash, say
stop, pause, resume, save, load, fetch

### Event Words

when, if, else, every, after, before
touches, hits, meets, pressed, starts, ends

### Input Devices

keyboard, joystick, touch, click, tap, swipe

---

## What This Means

meeEL is not a framework. It is not a game engine.

It is a **language**.

Any user can write any idea — calculator, todo, chat, game — using the same rules.
The engine parses meaning, not patterns.

---

*End of Training Sheet v1.0*

*Built by Ocide.*
