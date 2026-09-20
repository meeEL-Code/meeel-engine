// meeEL syntax — CodeMirror 6 StreamLanguage
import { StreamLanguage } from '@codemirror/language';

export const meeelLanguage = StreamLanguage.define({
  name: 'meeel',
  startState() { return {}; },
  token(stream: any) {
    if (stream.eatSpace()) return null;

    // Comment: # ... to end of line
    if (stream.match(/#.*/)) return 'comment';

    // Block/property name followed by -[
    if (stream.match(/[a-z][a-z0-9-]*(?=-\[)/)) return 'keyword';

    // -[ opener
    if (stream.match(/-\[/)) return 'bracket';

    // Standalone [ or ]
    if (stream.match(/[\[\]]/)) return 'bracket';

    // Numbers: 48px, 50%, 100
    if (stream.match(/\d+px|\d+%|\d+/)) return 'number';

    // Quoted string
    if (stream.match(/"[^"]*"/)) return 'string';

    // Bare word (value)
    if (stream.match(/[^\s\[\]#]+/)) return 'string';

    stream.next();
    return null;
  },
});
