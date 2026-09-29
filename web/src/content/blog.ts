/**
 * Guides written for Labora. Article text is English; the chrome around it (categories, buttons) is translated.
 * Add an article by appending to POSTS — the blog index, article pages and sitemap pick it up automatically.
 */
export type Block =
  | { t: "p"; text: string }
  | { t: "h2"; text: string }
  | { t: "ul"; items: string[] }
  | { t: "ol"; items: string[] }
  | { t: "quote"; text: string }
  | { t: "callout"; text: string };

export type Category = "finding" | "writing" | "after" | "goals";

export interface Post {
  slug: string;
  category: Category;
  title: string;
  excerpt: string;
  date: string;
  minutes: number;
  blocks: Block[];
}

export const POSTS: Post[] = [
  {
    slug: "where-to-find-undergraduate-research",
    category: "finding",
    title: "Eight places to find an undergraduate research position",
    excerpt: "Postings are only one door. Here are the places students actually land their first lab — and how to use each one.",
    date: "2026-09-08",
    minutes: 6,
    blocks: [
      { t: "p", text: "Most students look for research the same way: they wait for a posting. Postings exist, but they are the smallest door. Many labs take students through conversations, course connections and short emails long before anything is advertised. Here are eight places to look, roughly in the order worth trying." },
      { t: "h2", text: "1. Your own classes" },
      { t: "p", text: "The professor teaching a course you enjoy already knows your name and your work. Go to office hours with a question about the material, then — later, not in the same breath — ask how students get involved in their group. This is the warmest introduction you can get." },
      { t: "h2", text: "2. Your department's research page" },
      { t: "p", text: "Many departments and undergraduate research offices keep a list of current faculty interests, sometimes with openings. Read it for the people, not just the postings: it tells you who works on what." },
      { t: "h2", text: "3. Lab websites" },
      { t: "p", text: "Look for a “join us” or “prospective members” page. Some labs describe exactly what they expect from an undergraduate — hours, skills, how to apply. Follow those instructions to the letter." },
      { t: "h2", text: "4. Recent papers" },
      { t: "p", text: "A paper published in the last couple of years is the best possible reason to write to someone. It shows you what the lab is doing now, and gives you a specific thing to ask about. Tools like Labora's professor search are built for this step." },
      { t: "h2", text: "5. Summer programmes" },
      { t: "p", text: "Funded summer research programmes exist in many countries and fields; in the US, the NSF's REU programmes are a well-known example. Applications usually open in the autumn or winter, so start earlier than feels necessary." },
      { t: "h2", text: "6. Student symposiums and poster sessions" },
      { t: "p", text: "Go to one, even if you're not presenting. Talk to the students standing beside posters — they will tell you which labs are welcoming, what the day-to-day is really like, and who is looking for help." },
      { t: "h2", text: "7. Graduate students and postdocs" },
      { t: "p", text: "The people who train undergraduates are often the graduate students in the lab. A short, specific message to a grad student can lead to an introduction faster than one to a busy professor." },
      { t: "h2", text: "8. Open positions on Labora" },
      { t: "p", text: "Professors on Labora post roles directly, with their research attached, so you can read before you apply. It won't replace outreach, but it is a good place to start." },
      { t: "callout", text: "Whichever door you use, the pattern is the same: show that you've read something specific, say what you can offer, and make a small, clear ask." },
    ],
  },
  {
    slug: "how-to-cold-email-a-professor",
    category: "writing",
    title: "How to cold email a professor: a structure that gets read",
    excerpt: "Four short parts, one specific question and a low-pressure ask. A repeatable structure for your first message.",
    date: "2026-09-10",
    minutes: 6,
    blocks: [
      { t: "p", text: "Professors get many messages, and most are easy to skim past: long, generic and asking for something big. A good outreach email is the opposite — short, specific and easy to answer. Here is a structure you can adapt." },
      { t: "h2", text: "The four parts" },
      { t: "ol", items: [
        "Who you are, in one line, with something you've actually done. “I'm a sophomore in biology; last term I analysed a public sequencing dataset in R.”",
        "Why them, with one specific detail from a recent paper — and a real question it raised for you.",
        "What you can offer and when: hours per week, a term, a skill. Be honest and concrete.",
        "A small, clear ask — and a way out. “If you aren't taking students, is there someone in your group I should contact?”",
      ] },
      { t: "h2", text: "Keep it short" },
      { t: "p", text: "Aim for about 90 to 180 words. Long enough to be specific, short enough to read on a phone between meetings. If a sentence doesn't help the professor decide, cut it." },
      { t: "h2", text: "Be specific — not flattering" },
      { t: "p", text: "Praise is easy to write and easy to ignore. A precise question shows you read the work. Compare “I found your research fascinating” with “In Figure 3, why does accuracy drop when the sample is under 30?”. The second one can only come from someone who looked." },
      { t: "h2", text: "Write in your own voice" },
      { t: "p", text: "Readers notice templates and machine-written prose quickly. Draft it yourself, read it aloud, and remove anything you wouldn't say to a person. Tools can point out problems; the words should be yours." },
      { t: "h2", text: "Details that matter" },
      { t: "ul", items: [
        "Address the professor by name and spell it correctly.",
        "Use a plain, specific subject line — mention the paper or topic.",
        "Send on a weekday morning, and avoid exam weeks and holidays.",
        "Attach nothing unless asked; you can offer to send a CV.",
        "Sign off with your full name and your university.",
      ] },
      { t: "callout", text: "Paste your draft into Labora's email checker to see exactly which phrases might work against you." },
    ],
  },
  {
    slug: "subject-lines-that-get-opened",
    category: "writing",
    title: "Subject lines that get opened — and ones that don't",
    excerpt: "The subject line decides whether your email is read at all. What to include, and what to leave out.",
    date: "2026-09-12",
    minutes: 4,
    blocks: [
      { t: "p", text: "A subject line has one job: to make a busy person open the message. It should tell them what the email is about and signal that it was written for them." },
      { t: "h2", text: "What works" },
      { t: "ul", items: [
        "Naming a specific paper or topic: “Question about your depth-estimation paper”.",
        "A short description of the ask: “Prospective volunteer for your sleep-EEG project”.",
        "Something that could only be sent to this professor.",
      ] },
      { t: "h2", text: "What doesn't" },
      { t: "ul", items: [
        "One-word subjects — “Research”, “Question”, “Hello”.",
        "Anything urgent or shouty — “URGENT”, all capitals, exclamation marks.",
        "Vague requests — “Opportunity”, “Inquiry”.",
        "Very long subjects that get cut off on a phone.",
      ] },
      { t: "h2", text: "A simple formula" },
      { t: "p", text: "Try “[Your status] interested in [specific topic]”: for example, “Sophomore interested in graph neural networks”. Then let the first line of the email say why you're writing to this person." },
      { t: "quote", text: "If your subject line could be sent to fifty professors unchanged, it will be treated like it was." },
    ],
  },
  {
    slug: "read-a-research-paper-in-20-minutes",
    category: "finding",
    title: "How to read a research paper in 20 minutes when you're new to the field",
    excerpt: "You don't need to understand everything. You need enough to ask one good question.",
    date: "2026-09-14",
    minutes: 5,
    blocks: [
      { t: "p", text: "Research papers are written for specialists. If you're an undergraduate, you won't follow every equation — and you don't need to. The goal before writing to a professor is modest: understand the question, the main result and one thing you could ask." },
      { t: "h2", text: "Step 1: title and abstract (2 minutes)" },
      { t: "p", text: "Read them twice. Write, in your own words, what problem the paper addresses and what they found. If you can't, that's fine — that's what the next steps are for." },
      { t: "h2", text: "Step 2: figures and captions (4 minutes)" },
      { t: "p", text: "Figures usually tell the story faster than text. Look at each one and read its caption. Which result do the authors seem proudest of?" },
      { t: "h2", text: "Step 3: the end of the introduction (3 minutes)" },
      { t: "p", text: "The last paragraph of the introduction typically states what the paper contributes. It's the best summary in the paper." },
      { t: "h2", text: "Step 4: discussion and limitations (5 minutes)" },
      { t: "p", text: "Authors often say what they couldn't do or what they'd try next. That is where your best questions live: “Have you tried this on a different dataset?”, “What would change if the sample were larger?”." },
      { t: "h2", text: "Step 5: methods, only as needed (5 minutes)" },
      { t: "p", text: "Skim methods for anything you want to understand better. Don't feel bad about looking up terms — that's how everyone learns a new field." },
      { t: "callout", text: "Finish by writing three things: what you understood, what confused you, and one question you're genuinely curious about. The last one belongs in your email." },
      { t: "p", text: "Labora's plain-English summaries can give you a starting point, but reading a little of the actual paper yourself is what makes your email sound like you." },
    ],
  },
  {
    slug: "what-to-do-if-a-professor-does-not-reply",
    category: "after",
    title: "What to do when a professor doesn't reply",
    excerpt: "Silence usually means busy, not no. How to follow up politely, when to stop, and where to go next.",
    date: "2026-09-16",
    minutes: 5,
    blocks: [
      { t: "p", text: "You sent a careful email and heard nothing. That's normal. Professors are pulled in many directions, and a message can sit unread for days. Silence usually means busy, not no — but it's still worth having a plan." },
      { t: "h2", text: "Follow up once or twice" },
      { t: "ul", items: [
        "Wait about a week, then send a short nudge that adds something new — a specific question, or a brief update on what you've been reading.",
        "If there's still no reply, send one final note about two weeks after the first. Thank them, say you understand they're busy, and ask whether someone else in the group might be a better contact.",
      ] },
      { t: "h2", text: "What to avoid" },
      { t: "ul", items: [
        "Guilt or pressure — “I'm still waiting for your reply”.",
        "Contacting them on every channel at once.",
        "Sending more than two follow-ups.",
      ] },
      { t: "h2", text: "Try another route" },
      { t: "p", text: "Write to a graduate student or postdoc in the lab, or to the department's undergraduate coordinator. They often know who has room, and an introduction from inside the group is more likely to get answered." },
      { t: "h2", text: "Know when to move on" },
      { t: "p", text: "After two follow-ups, it's time to put your energy elsewhere. Send that email to another researcher whose work interests you. Most students who land positions wrote to several people." },
      { t: "callout", text: "Labora's follow-up planner drafts two well-timed messages and can add reminders to your calendar." },
    ],
  },
  {
    slug: "what-professors-look-for-in-undergraduates",
    category: "after",
    title: "What professors look for in undergraduate researchers",
    excerpt: "It's rarely about a perfect GPA. The qualities that make a first-year student useful to a lab.",
    date: "2026-09-18",
    minutes: 5,
    blocks: [
      { t: "p", text: "If you're wondering whether you're qualified enough to join a lab, take heart: labs rarely expect undergraduates to already be experts. What they look for is much more about how you work than what you already know." },
      { t: "h2", text: "Reliability" },
      { t: "p", text: "Showing up when you said you would, finishing what you start and telling people early when something is going wrong. Reliability makes a new student worth training." },
      { t: "h2", text: "Curiosity you can show" },
      { t: "p", text: "Not “I'm passionate about science”, but evidence: a question you asked, something you read, a small project you built. It signals that you'll keep learning without being pushed." },
      { t: "h2", text: "Basic skills for the work" },
      { t: "p", text: "Depending on the lab, that might be programming, statistics, lab safety training, or careful reading. Say honestly what you can do now and what you're willing to learn." },
      { t: "h2", text: "Clear communication" },
      { t: "p", text: "Short, specific emails. Asking questions when stuck. Explaining what you did and what you found. These small habits matter enormously in a group." },
      { t: "h2", text: "Honest availability" },
      { t: "p", text: "A student who says “ten hours a week for the fall term” and keeps to it is more valuable than one who promises twenty and disappears. Be realistic about exams and other commitments." },
      { t: "h2", text: "Fit with how the lab works" },
      { t: "p", text: "Some labs are fast and independent, others structured and closely mentored. Neither is better — but a mismatch is unhappy for everyone. It's why Labora shows how labs describe their working style." },
    ],
  },
  {
    slug: "paid-credit-or-volunteer",
    category: "goals",
    title: "Paid, for credit or volunteer? Choosing your first research role",
    excerpt: "Every arrangement has trade-offs. How to think about compensation, and how to ask about it politely.",
    date: "2026-09-20",
    minutes: 5,
    blocks: [
      { t: "p", text: "Research positions come in three broad forms. None is “better” — the right one depends on your schedule, finances and goals." },
      { t: "h2", text: "Paid positions" },
      { t: "p", text: "Paid roles are often hourly or stipend-based, funded by grants or work-study. They tend to come with clearer expectations and hours. They can also be competitive, and funding is limited." },
      { t: "h2", text: "For credit" },
      { t: "p", text: "Many departments let you register for research credit. You usually agree on a project and weekly hours with your supervisor, and there may be a short report or presentation. It's a good route if you can't take an unpaid job." },
      { t: "h2", text: "Volunteer" },
      { t: "p", text: "Volunteering is often the easiest way in, especially for first-years, and can turn into a paid or credit role once you've shown you're reliable. The trade-off: it costs you time without income, so protect your schedule and set a clear end date." },
      { t: "h2", text: "How to ask about funding" },
      { t: "p", text: "Ask once the professor is interested, and keep it matter-of-fact: “Is this position paid, for credit, or volunteer? I'm open to any of them but wanted to plan my schedule.” Never demand payment in a first email." },
      { t: "h2", text: "Watch out for" },
      { t: "ul", items: [
        "Vague expectations about hours and duties.",
        "Being asked to do unrelated errands rather than research.",
        "No named person who will supervise you day to day.",
      ] },
      { t: "callout", text: "On Labora every position shows compensation, weekly hours and term upfront, so you can filter for what works for you." },
    ],
  },
  {
    slug: "research-for-medical-school-and-phd-applications",
    category: "goals",
    title: "Research experience for medical school and PhD applications: what counts",
    excerpt: "Depth beats a long list. How to think about hours, outcomes and the recommendation letter that grows out of them.",
    date: "2026-09-22",
    minutes: 6,
    blocks: [
      { t: "p", text: "Whether you're planning for medical school, a PhD or simply exploring, research experience is valuable — but not all research experience reads the same way. Here's what tends to matter." },
      { t: "h2", text: "Depth over breadth" },
      { t: "p", text: "One project you stayed with for a year, where you took on more responsibility over time, tells a stronger story than four short stints. Admissions readers want to see that you can commit and grow." },
      { t: "h2", text: "You don't need a publication" },
      { t: "p", text: "Publications are wonderful but not required. A poster, a presentation to your group, a well-documented analysis or a reproducible pipeline all show real contribution." },
      { t: "h2", text: "Be able to explain your work" },
      { t: "p", text: "You should be able to say, in plain language, what question the project asked, what you did and what you learned — including what didn't work. Interviewers often go straight to this." },
      { t: "h2", text: "The recommendation letter" },
      { t: "p", text: "A professor or supervisor who has watched you work for several months can write specifics that a stranger cannot. Regular check-ins and taking ownership of a piece of the project make that letter possible." },
      { t: "h2", text: "For pre-medical students" },
      { t: "p", text: "Both laboratory and clinical research can be meaningful. Choose based on what genuinely interests you and what you can sustain — requirements vary by school, so check the ones you're targeting." },
      { t: "h2", text: "Keep a record" },
      { t: "p", text: "Note dates, hours, tasks, methods and outcomes as you go. When it's time to write applications, you'll be glad you did." },
    ],
  },
];

export const postBySlug = (slug: string) => POSTS.find((p) => p.slug === slug);
export const CATEGORIES: Category[] = ["finding", "writing", "after", "goals"];
