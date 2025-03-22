## **Tag the Blob: Game Description Document (MVP)**

### **Overview**

**Tag the Blob** is a lighthearted, 3D multiplayer tag game where players control cute, bouncy blobs in an infinite arena. One blob starts as "it" and tags others by bumping into them. Tagged blobs join the "it" team to chase the rest. The last untagged blob wins the round. With real-time joining, intuitive controls, and power-ups like speed boost, invisibility, and flight, the game offers chaotic fun and replayability.

---

### **Characters**

- **Blobs**:  
  - Players control spherical, bouncy blobs with unique colors (e.g., blue, pink, yellow).  
  - Blobs feature cute animations like squishing when moving.  
- **"It" Blob**:  
  - Randomly chosen at the start of each round.  
  - Visually distinct with a red glow or small crown.  
- **Bots**:  
  - Added if fewer than 5 players to maintain lively gameplay.  
  - Mimic player blobs but follow simple patterns (e.g., dodging or chasing).

---

### **Objectives**

- **For Untagged Blobs**:  
  - Evade the "it" team for as long as possible.  
- **For "It" Team**:  
  - Tag untagged blobs by colliding with them to expand the "it" team.  
- **Winning**:  
  - The last untagged blob wins the round.  
  - If all blobs are tagged or a 3-minute timer expires, the blob with the longest survival time wins.

---

### **Game Mechanics**

- **Movement**:  
  - **Desktop**: WASD or arrow keys.  
  - **Mobile**: Virtual joystick or tilt controls.  
  - "It" blobs move 10% faster than untagged blobs.  
- **Tagging**:  
  - "It" blobs tag untagged blobs via collision.  
  - Tagged blobs immediately join the "it" team.  
- **Spectator Role**:  
  - Tagged blobs become spectators, free to move around and watch.  
- **Power-Ups** (MVP Version):  
  - Available only to untagged blobs.  
  - Spawn randomly every 15-20 seconds, visible to all.  
  - Types:  
    - **Speed Boost**: Increases speed by 50% for 5 seconds.  
    - **Invisibility**: Makes the blob invisible to the "it" team for 5 seconds. The player sees a faint outline, but "it" blobs see nothing.  
    - **Flight**: Lifts the blob above the ground for 5 seconds, untouchable by the "it" team. Can’t tag others while active.  
- **Bots**:  
  - Maintain a minimum of 5 blobs in the game.  
  - Untagged bots dodge; "it" bots chase.  
- **Round Reset**:  
  - Ends when all blobs are tagged or the timer runs out.  
  - New round starts after a 10-second break with a new "it" blob.

---

### **Look and Feel**

- **Visuals**:  
  - **Style**: Simple 3D with cute blobs featuring googly eyes or smiles.  
  - **Arena**: Infinite, open space with a light grassy or grid texture.  
  - **"It" Blob**: Red glow or tiny crown for identification.  
  - **Power-Ups**:  
    - **Speed Boost**: Glowing yellow star.  
    - **Invisibility**: Transparent, shimmering orb.  
    - **Flight**: Small wings or propeller icon.  
- **User Experience (UX)**:  
  - **HUD**: Minimal, displaying:  
    - Round timer (3 minutes).  
    - Untagged vs. "it" blob count.  
    - Leaderboard of top survivors.  
  - **Controls**: Intuitive for desktop and mobile.  
- **Sound**:  
  - "Boing" for blob movement.  
  - "Splat" or "pop" for tags.  
  - Cheerful tune at round’s end.  
  - Power-up sounds:  
    - Speed Boost: "Whoosh."  
    - Invisibility: "Shimmer."  
    - Flight: "Flap" or "whir."

---

### **Engagement & Fun Factor**

- **Chaos**:  
  - Bouncy blobs, a growing "it" team, and three power-ups (speed boost, invisibility, flight) create unpredictable fun.  
- **Humor**:  
  - Cute designs and silly sounds keep it playful.  
  - Tagged blobs may flop comically.  
- **Competition**:  
  - Leaderboard tracks survival times, encouraging rivalry.  
  - Quick rounds boost replayability.

---

### **Game Flow**

1. **Joining**:  
   - Players click "Join Game" (no login required).  
   - Instantly enter as a blob.  
2. **Starting a Round**:  
   - Bots fill in if fewer than 5 players.  
   - One blob is randomly "it."  
3. **Playing**:  
   - Untagged blobs evade; "it" blobs tag.  
   - Power-ups spawn for untagged blobs.  
4. **Ending a Round**:  
   - Ends when all are tagged or time’s up.  
   - Winner celebrated; new round begins.

---

### **MVP Scope**

- **Core Features**:  
  - Real-time multiplayer (up to 10 players \+ bots).  
  - Basic movement and tagging.  
  - Three power-ups: speed boost, invisibility, flight.  
  - Simple bot AI.  
  - Lightweight 3D visuals and sounds.  
- **Exclusions for MVP**:  
  - No additional power-ups.  
  - No complex spectator roles.  
  - No extras like emotes or global leaderboards.