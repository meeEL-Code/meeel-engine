# meeEL Grammar v1.0

*A simple English-based language for building games and apps.*

**by Ocide**

---

## Table of Contents

1. [What is meeEL?](#1-what-is-meeel)
2. [The Three Rules](#2-the-three-rules)
3. [Values](#3-values)
4. [Entities](#4-entities)
5. [Screens](#5-screens)
6. [Events](#6-events)
7. [Actions](#7-actions)
8. [Special Blocks](#8-special-blocks)
9. [Full Examples](#9-full-examples)
10. [Vocabulary Reference](#10-vocabulary-reference)

---

## 1. What is meeEL?

meeEL is a language you write in plain English. It turns into HTML, CSS, and JavaScript that runs in any browser.

If you can read English, you can read meeEL.

---

## 2. The Three Rules

A meeEL program has **three kinds of parts**. Each has its own shape.

### Rule 1 — Entities use `[ brackets ]`

An entity is something in your game — a player, a coin, an enemy.


player #hero [
shape: circle
color: blue
size: 50
]

### Rule 2 — Screens use `: colon` and indent

A screen is the world where your game happens.


screen "My Game":
background "dark-blue"

### Rule 3 — Events use `when ... :` and indent

An event is what happens during the game.


when #hero touches #coin:
add 10 to score
destroy #coin

That's it. Three rules.

---

## 3. Values

You write values after a `:` or inside an action.

| Type          | Examples                        | Notes                  |
|---------------|---------------------------------|------------------------|
| **Number**    | `50`, `-25`, `3.14`             | No quotes              |
| **String**    | `"hello"`, `"coin.wav"`         | Always in quotes       |
| **Color**     | `#ff0000`, `#000`, `dark-blue`  | Hex or shortcut name   |
| **Reference** | `#hero`, `#coin`                | Points to an entity    |
| **Name**      | `circle`, `blue`, `top`         | Plain word             |

### Color shortcuts

`white` `black` `red` `blue` `green` `yellow` `gold` `orange`
`purple` `pink` `gray` `dark-blue` `dark` `light`

---

## 4. Entities

An entity is anything you place on screen.

### Form


<type> <name> [ <properties> ]

· type — what kind it is (player, enemy, coin, button)
· name — a unique name you choose (hero, boss, golden-coin)
· properties — one per line

Properties

| Property | Value | Example |
|---|---|---|
| shape | circle, square, triangle, star, heart, hexagon, diamond | shape: circle |
| color | shortcut or hex | color: blue |
| size | number (in pixels) | size: 50 |
| face | smiley, angry, sad, cool, wink, neutral | face: smiley |
| image | file path | image: "hero.png" |
| health | number | health: 100 |
| speed | number | speed: 5 |
| starting at | bottom, top, top right, top left, center | starting at bottom |

Examples


player #hero [
shape: circle
color: blue
size: 50
face: smiley
starting at bottom
]
enemy #boss [
shape: triangle
color: red
size: 60
face: angry
starting at top
]
coin [
shape: circle
color: gold
size: 20
starting at top
]

Note: If you don't give a name (`coin [ ... ]`), the name is coin.

Multiple of the same kind


red enemy [
shape: triangle
color: red
starting at top right
]
blue enemy [
shape: triangle
color: blue
starting at top left
]

Here:
· red enemy — name is red-enemy
· blue enemy — name is blue-enemy

You can touch each one separately:


when #hero touches red-enemy:
add 5 to score

---

## 5. Screens

A screen is the page or world you see.

Form


screen "Name":
<settings>
<events>

Settings

| Setting | Value | Example |
|---|---|---|
| background | color or image | background "dark-blue" |
| title | string | title "My Game" |

Example


screen "Arena":
background "dark-blue"
show text "Score: " + score at top right

---

## 6. Events

An event says when something happens, do these things.

Forms


when <subject> <verb> <object>:
<actions>
when <verb> <object>:
<actions>
every <number> <unit>:
<actions>

Verbs

| Verb | Meaning | Example |
|---|---|---|
| touches | subject and object meet | when #hero touches #coin: |
| hits | same as touches | when #hero hits #boss: |
| press | key or button pressed | when press space: |
| starts | begins | when game starts: |

Every


every 1 second:
modify #hero health by -1
every 3 seconds:
spawn enemy at top

Supported units: second, seconds, millisecond, milliseconds, minute, minutes.

Example


when #hero touches #coin:
add 10 to score
destroy #coin
play "coin.wav"
when #hero touches #boss:
modify #hero health by -25
flash #hero
every 1 second:
modify #hero health by -1

---

## 7. Actions

An action is a single instruction inside an event.

Math


add <number> to <target>
subtract <number> from <target>
modify <ref> <property> by <number>
set <target> to <value>

Examples:

add 10 to score
subtract 5 from health
modify #boss health by -25
set #hero speed to 8

Entities


destroy <ref>
spawn <type> at <position>
move <ref> <direction> speed <number>

Examples:

destroy #coin
spawn enemy at top
move #hero right speed 5

Visuals


flash <ref>
show text "<text>" at <position>
show screen "<name>"
play animation "<name>"

Examples:

flash #hero
show text "You Win!" at center
show screen "GameOver"
play animation "walk"

Sound


play "<filename>"

Examples:

play "coin.wav"
play "hit.wav"
play "victory.wav"

Flow


stop game
pause game
resume game

---

## 8. Special Blocks

joystick — touch control

Adds an on-screen joystick for moving the player.


joystick [
when move up    [ move #hero up    speed 5 ]
when move down  [ move #hero down  speed 5 ]
when move left  [ move #hero left  speed 5 ]
when move right [ move #hero right speed 5 ]
]

keyboard — key mapping


keyboard [
when press space:
make #hero jump
]

---

## 9. Full Examples

Example A — Coin Chase


player #hero [
shape: circle
color: blue
size: 50
face: smiley
starting at bottom
]
coin [
shape: circle
color: gold
size: 20
starting at top
]
joystick [
when move up    [ move #hero up    speed 5 ]
when move down  [ move #hero down  speed 5 ]
when move left  [ move #hero left  speed 5 ]
when move right [ move #hero right speed 5 ]
]
screen "Coin Chase":
background "dark-blue"
when #hero touches coin:
add 10 to score
destroy coin
play "coin.wav"

Example B — Fighter


player #fighter [
shape: square
color: blue
size: 60
face: smiley
health: 100
starting at bottom
]
enemy #boss [
shape: triangle
color: red
size: 60
face: angry
health: 200
starting at top
]
joystick [
when move up    [ move #fighter up    speed 6 ]
when move down  [ move #fighter down  speed 6 ]
when move left  [ move #fighter left  speed 6 ]
when move right [ move #fighter right speed 6 ]
]
screen "Arena":
background "dark-blue"
show text "HP: " + #fighter health at top left
show text "Boss HP: " + #boss health at top right
when press j:
modify #boss health by -15
play "punch.wav"
flash #boss
when press k:
modify #boss health by -25
play "kick.wav"
flash #boss
when #boss health <= 0:
show text "YOU WIN!" at center
play "victory.wav"
stop game
when #fighter health <= 0:
show text "GAME OVER" at center
play "game_over.wav"
stop game

Example C — Clicker


button #click-button [
shape: circle
color: orange
size: 100
text: "TAP"
starting at center
]
screen "Clicker":
background "dark"
show text "Score: " + score at top
when #click-button is pressed:
add 1 to score
play "click.wav"
flash #click-button

---

## 10. Vocabulary Reference

Types (entity kinds)
`player` `enemy` `coin` `button` `item` `npc` `wall` `door`

Shapes
`circle` `square` `triangle` `star` `heart` `hexagon` `diamond`

Faces
`smiley` `angry` `sad` `cool` `wink` `neutral` `surprised`

Colors (shortcuts)
`white` `black` `red` `blue` `green` `yellow` `gold` `orange` `purple` `pink` `gray` `dark-blue` `dark` `light`

Positions
`top` `bottom` `left` `right` `center` `top left` `top right` `bottom left` `bottom right`

Event verbs
`touches` `hits` `press` `starts` `reaches` `leaves`

Action verbs
`add` `subtract` `modify` `set` `move` `destroy` `spawn` `create` `flash` `show` `hide` `play` `stop` `pause` `resume` `reload`

Directions (for move)
`up` `down` `left` `right` `towards` `away`

Units (for every)
`second` `seconds` `minute` `minutes` `millisecond` `milliseconds`

---

Comments

Anything after `#` (hash and space) is ignored:


This is a comment
player #hero [
shape: circle    # so is this
color: blue
]

---

Naming Rules

· Names start with a letter
· Can contain letters, digits, `-`, `_`
· No spaces
· Case-sensitive (`Hero` and `hero` are different)

Good: `hero`, `red-enemy`, `coin_1`, `Player2`
Bad: `my hero`, `2nd-player`, `hero!`

---

Common Mistakes

| Mistake | Fix |
|---|---|
| `player [ ... ]` (no name) | Use `player #hero [ ... ]` |
| `color blue` (no colon) | Use `color: blue` |
| `"50"` (number as string) | Use `50` |
| `when hero touches coin` (no `:`) | Add `:` at end |
| `add 10 score` (missing `to`) | Use `add 10 to score` |
| `destroy #coin` | Only use `#` in events, not declarations |

---

Write your first program

Copy this and try it:


player #hero [
shape: circle
color: blue
size: 50
starting at bottom
]
coin [
shape: circle
color: gold
size: 20
starting at top
]
screen "My First Game":
background "dark-blue"
when #hero touches coin:
add 10 to score
destroy coin

That's it. Welcome to meeEL.

---

End of Grammar v1.0

Built by Ocide — meeEL is a language that understands you.
