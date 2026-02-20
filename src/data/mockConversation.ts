import { Participant, MockScript } from "@/types/meeting";

export const participants: Participant[] = [
  { id: "you", name: "You", color: "210 60% 45%", initial: "Y", isLocal: true },
  { id: "person-a", name: "Person A", color: "150 50% 40%", initial: "A", isLocal: false },
  { id: "person-b", name: "Person B", color: "30 70% 50%", initial: "B", isLocal: false },
  { id: "person-c", name: "Person C", color: "280 45% 50%", initial: "C", isLocal: false },
];

export const scriptLines: MockScript[] = [
  {
    speakerId: "person-a",
    text: "Hey everyone, thanks for joining. Should we get started?",
    explanation: "They're being polite and signaling they want to begin the meeting.",
  },
  {
    speakerId: "person-b",
    text: "Sure, sounds good to me.",
    explanation: "They're agreeing casually — no strong feelings either way.",
  },
  {
    speakerId: "person-c",
    text: "Yeah, let's do it. I have another call in an hour.",
    explanation: "They're agreeing but also setting a time boundary. This is a practical comment, not rude.",
  },
  {
    speakerId: "person-a",
    text: "So I was thinking we could try a different approach this time.",
    explanation: "They're introducing a new idea. They sound open and are inviting feedback.",
  },
  {
    speakerId: "person-b",
    text: "Hmm, yeah… I guess that could work.",
    explanation: "The hesitation ('hmm', 'I guess') suggests they have doubts but don't want to disagree openly.",
  },
  {
    speakerId: "you",
    text: "What kind of approach did you have in mind?",
    explanation: "You're asking a clarifying question — this shows engagement and interest.",
  },
  {
    speakerId: "person-a",
    text: "Well, instead of the usual format, we could make it more interactive.",
    explanation: "They're elaborating on their idea with enthusiasm. They want others to get excited too.",
  },
  {
    speakerId: "person-c",
    text: "That's actually a great idea! I love it.",
    explanation: "They're genuinely excited and supportive. The exclamation shows strong positive emotion.",
  },
  {
    speakerId: "person-b",
    text: "I mean, it's fine, but have we thought about the timeline?",
    explanation: "They're raising a practical concern. 'It's fine' here doesn't mean they love it — it means they're okay with it but worried about logistics.",
  },
  {
    speakerId: "person-a",
    text: "That's a fair point. Let's figure that out together.",
    explanation: "They're acknowledging the concern without getting defensive. This is collaborative language.",
  },
  {
    speakerId: "you",
    text: "I think we could start small and see how it goes.",
    explanation: "You're suggesting a cautious approach — a good way to address concerns while still moving forward.",
  },
  {
    speakerId: "person-c",
    text: "Yeah, no pressure. We can always adjust.",
    explanation: "They're being reassuring and flexible. This reduces tension in the group.",
  },
  {
    speakerId: "person-b",
    text: "Alright, I'm on board. Let's try it.",
    explanation: "They've come around and are now agreeing. Their earlier hesitation has resolved.",
  },
  {
    speakerId: "person-a",
    text: "Awesome! Thanks everyone. This is going to be great.",
    explanation: "They're wrapping up with positive energy and gratitude. The conversation ended on a good note.",
  },
];
