# Recording & MIDI Playback Guide

## Quick Start

### 1. Record Your Performance

```
1. Click anywhere to initialize audio context
2. Click [PLAY] button to start playback
3. Click [RECORD] button to start recording
   - Yellow pulse: 4-beat lead-in metronome (counts you in)
   - Recording light turns RED: Now recording audio + MIDI
4. Play notes on your keyboard (Q-U, A-J, 1-5, 6-0 for QWERTY layout)
5. Click [RECORD] button again to stop
   - Check browser console for MIDI note data
```

### 2. Play Back Your Recording

```
1. Click [PLAY] button
   - Recorded MIDI notes will play back automatically
   - Audio recording is available for download
```

---

## Understanding the Console Output

After recording, open browser DevTools (F12) and check the console for:

### Audio Recording
```
Recording saved: blob:https://example.com/...
You can download or playback this audio
```

### MIDI Notes Recorded
```
MIDI notes recorded: 8 notes
MIDI data: [
  { frequency: 440, noteKey: 'KeyQ', startBeat: 0.5, duration: 1.2, velocity: 100 },
  { frequency: 493.88, noteKey: 'KeyW', startBeat: 1.8, duration: 0.8, velocity: 100 },
  ...
]
```

---

## MIDI Note Breakdown

Each recorded note contains:

| Field | Meaning | Example |
|-------|---------|---------|
| `frequency` | Pitch in Hz | 440 (A4), 261.6 (C4) |
| `noteKey` | Keyboard key pressed | 'KeyQ', 'KeyW', 'Digit1' |
| `startBeat` | Beat when note started | 0.5, 1.8, 3.2 |
| `duration` | How long note held (in beats) | 1.2, 0.8, 2.0 |
| `velocity` | Note velocity (0-127) | 100 (currently fixed) |

**Example Timeline:**
```
Beat: 0      1      2      3      4
      |------|------|------|------|
Qtr:  Q (start)
           R (start)
      Q (ends)---
                R (ends)---
                     E (start & ends)
```

---

## Keyboard Layout

### QWERTY Mode (Default)

**First Octave (C4-B4):**
```
White keys:  Q  W  E  R  T  Y  U  (C D E F G A B)
Black keys:  1  2  3  4  5           (C# D# F# G# A#)
```

**Second Octave (C5-B5):**
```
White keys:  A  S  D  F  G  H  J  (C D E F G A B)
Black keys:  6  7  8  9  0           (C# D# F# G# A#)
```

### Change Octave
- **Octave Up Button**: Shift all notes up 12 semitones
- **Octave Down Button**: Shift all notes down 12 semitones
- Display shows current octave (e.g., "C4" for octave 4)

---

## Playback Line Features

### Moving Smoothly
The red vertical line moves smoothly across the grid as playback progresses.

### Scrubbing (Seeking)
- **Click & drag** the playback line to jump to any position
- **Click anywhere** on the grid to jump to that beat
- Playback resumes from new position

### Visual Feedback
- **Normal**: Thin red line with glow
- **Hover**: Thicker line, brighter glow
- **Dragging**: Orange glow, extra bright

---

## Recording Tips

### Best Practices
1. **Enable Metronome** (♩ button) - helps with timing
2. **Use the Lead-In** - 4-beat count helps you prepare
3. **Space Notes Out** - don't play too many at once
4. **Hold Keys Longer** - duration is captured automatically
5. **Simple Melodies** - start with basic note sequences

### Example Recording Session
```
Setup:
1. Set BPM to 120 (default is good)
2. Click Metronome (♩) button to enable
3. Open Browser Console (F12) to see MIDI data

Record:
1. Click Play
2. Click Record
3. Wait for metronome lead-in (4 beats)
4. Play along: Q-W-E-R pattern
5. Click Record to stop

Result:
- Audio file ready for download
- MIDI notes logged in console with beat positions
```

---

## Playback Behavior

### Automatic Playback
When you have recorded MIDI notes and press Play:
- Notes trigger at their recorded beat positions
- Note durations are respected
- Multiple overlapping notes work (polyphonic)
- Looping resets the state for next cycle

### Recording + Playback
If you record MIDI while already having notes:
- New notes are added to the MIDI sequence
- Both sets playback together
- Use `clearMidiNotes()` in console to reset

### Live Playing + MIDI Playback
You can play live on keyboard while MIDI notes playback:
- Played notes and recorded notes mix together
- No conflicts or interference
- Great for layering/overdubbing

---

## Advanced Usage

### In Browser Console

**Get all recorded MIDI notes:**
```javascript
dawCore.getMidiNotes()
// Returns array of note objects
```

**Clear MIDI notes:**
```javascript
dawCore.clearMidiNotes()
// Clears the sequence
```

**Load MIDI notes from JSON:**
```javascript
const notesFromFile = [
  { frequency: 440, startBeat: 0, duration: 1, velocity: 100, noteKey: 'KeyQ' },
  { frequency: 494, startBeat: 1, duration: 0.5, velocity: 100, noteKey: 'KeyW' }
];

dawCore.setMidiNotes(notesFromFile);
// Play will now trigger these notes
```

**Check recording status:**
```javascript
dawCore.isRecording        // true/false
dawCore.isRecordingMidi    // true/false
dawCore.isRecordingLeadIn  // true/false
```

---

## Troubleshooting

### Recording Won't Start
- ✓ Click the page first (browser audio policy)
- ✓ Check microphone is connected/enabled
- ✓ Open console for error messages

### MIDI Notes Not Recording
- ✓ Check keyboard controller has dawCore reference
- ✓ Verify `isRecordingMidi` is true in console
- ✓ Try pressing different keys

### MIDI Won't Playback
- ✓ Verify notes were recorded (check console)
- ✓ Check notes have non-zero `duration`
- ✓ Make sure playback is running (Play button)
- ✓ Try clicking Play again

### Audio Quality Issues
- ✓ Close other tabs using audio
- ✓ Check system volume levels
- ✓ Try different browser if specific codec issue

### Playback Line Not Moving
- ✓ Make sure Play button is pressed (should be lit)
- ✓ Check browser tab is in focus
- ✓ Try pressing Play again

---

## File Locations

**MIDI Recording/Playback Logic:**
- DAW Core: `daw-core.js` (lines 40-251)
- Recording Start: `daw-core.js` (lines 98-124)
- MIDI Playback: `daw-core.js` (lines 215-242)

**Keyboard Integration:**
- Key Capture: `keyboard-controller.js` (lines 142-183, 188-205)
- DAW Connection: `app.js` (lines 25-27)

**UI Feedback:**
- Recording Events: `app.js` (lines 371-397)

**Playback Line:**
- Visual Update: `piano-roll.js` (lines 241-250)
- Dragging: `piano-roll.js` (lines 180-217)
- Styling: `styles.css` (lines 661-687)

---

## Next Steps

Once recording is working smoothly, you can:

1. **Export to MIDI File** - Save sequences as .mid files
2. **Piano Roll Editing** - Drag notes on grid to adjust timing
3. **Quantize Notes** - Snap to grid for timing correction
4. **Undo/Redo** - Revert recording mistakes
5. **Multi-Track** - Record multiple instrument tracks
6. **Session Storage** - Save recordings to browser storage

---

## FAQ

**Q: Can I record multiple takes?**
A: Yes, each recording overwrites the previous MIDI data. Save the MIDI to console before starting a new recording.

**Q: Can I edit recorded notes?**
A: Currently read-only via playback. Piano roll editing coming soon.

**Q: What's the maximum recording length?**
A: Limited by browser memory. Default 4-bar loop can record indefinitely with continuous playback.

**Q: Do recorded notes use the current synth settings?**
A: Yes! Recorded notes use whatever filter, LFO, effects settings you have active during playback.

**Q: Can I change BPM after recording?**
A: Yes, but note timing is relative to beats, so they'll stay in sync.

---

## Getting Help

Check the console (F12) for:
- Recording errors and status messages
- MIDI note data structure
- Performance metrics
- Warning/error logs

See `CRITICAL_FIXES_SUMMARY.md` for technical implementation details.

