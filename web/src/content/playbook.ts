import type { Block } from "./blog";

export interface PlaybookSection {
  id: string;
  title: string;
  /** Free accounts can read these; the rest unlock with a pass. */
  free: boolean;
  blocks: Block[];
}

export const PLAYBOOK: PlaybookSection[] = [
  {
    id: "one-idea",
    title: "1. One idea per email",
    free: true,
    blocks: [
      { t: "p", text: "Your first email has one job: to earn a reply. Not a position, not a meeting — a reply. Everything in it should serve one idea: “I read your work, I can help in a specific way, and I'd like to talk.”" },
      { t: "ul", items: ["One paper or result, not five.", "One thing you can offer, not a list of every skill.", "One ask, with an easy way to say no."] },
    ],
  },
  {
    id: "anatomy",
    title: "2. Anatomy of an email that gets read",
    free: true,
    blocks: [
      { t: "p", text: "Use this skeleton and replace every bracket with something true and specific. Keep the whole message between 90 and 180 words." },
      { t: "quote", text: "Hi Professor [Last name],\n\nI'm a [year] studying [major]. [One thing you've done that's relevant — a project, a course, a dataset.]\n\nYour recent paper on [topic] stayed with me, especially [specific result or method]. It made me wonder [a genuine question].\n\nI'd love to help in your group — even as a volunteer — for about [hours] a week this [term]. If you're not taking students, could you point me to someone in your group who might be?\n\nThank you,\n[Full name], [University]" },
      { t: "callout", text: "The bracket that matters most is the question. If you can't think of one, read one more section of the paper." },
    ],
  },
  {
    id: "timing",
    title: "3. Timing and channels",
    free: false,
    blocks: [
      { t: "ul", items: [
        "Send on a weekday morning, ideally Tuesday to Thursday.",
        "Avoid exam weeks, grant deadlines and holidays — replies drop when people are swamped.",
        "Start early: labs plan summer and fall placements months ahead.",
        "Use email. Don't message on several platforms at once.",
      ] },
    ],
  },
  {
    id: "follow-up",
    title: "4. The follow-up ladder",
    free: false,
    blocks: [
      { t: "ol", items: [
        "Day 7: one short nudge that adds something new — a question or a small update. Don't just “bump”.",
        "Day 16: a gracious final note. Thank them, say you understand they're busy, and ask whether someone else in the group might be a better contact.",
        "Then stop, and write to someone else.",
      ] },
      { t: "p", text: "Labora's follow-up planner drafts both messages and can put reminders in your calendar." },
    ],
  },
  {
    id: "no",
    title: "5. What to do with a “no”",
    free: false,
    blocks: [
      { t: "p", text: "A no is almost never about you. Labs fill up, funding runs out, timing is wrong. Reply with a short thank-you, ask if they'd suggest anyone else, and — if it feels natural — ask whether you can check in next term. Many yeses come from these polite second conversations." },
    ],
  },
  {
    id: "checklist",
    title: "6. The pre-send checklist",
    free: false,
    blocks: [
      { t: "ul", items: [
        "Is the professor's name spelled correctly?",
        "Does the subject line mention the paper or topic?",
        "Is there one specific detail from their work?",
        "Do I say something I've actually done?",
        "Is my ask clear and small?",
        "Do I offer a way for them to redirect me?",
        "Is it under about 180 words?",
        "Did I read it aloud — does it sound like me?",
        "Did I run it through the email checker?",
        "Is my full name and university at the bottom?",
      ] },
    ],
  },
];
