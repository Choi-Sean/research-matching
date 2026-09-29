import type { Block } from "./blog";

/**
 * Privacy Policy and Terms of Service — written to match how Labora actually handles data.
 * These are a solid starting point, not legal advice: have counsel review them for your jurisdiction before launch.
 */
export const LEGAL_UPDATED = "2026-09-29";

export const PRIVACY: Block[] = [
  { t: "p", text: "This policy explains what Labora collects, why, who can see it and the choices you have. We've tried to keep it readable. If something is unclear, contact us." },
  { t: "h2", text: "1. Information we collect" },
  { t: "ul", items: [
    "Account details: your name, university email address, role (student or professor), preferred language and a hashed password.",
    "Profile details you choose to add. For students: university, major, year, skills, interests, experience, availability, working-style preferences, links and whether you're discoverable. For professors: lab details, positions and research materials you share.",
    "Activity: applications, invitations, saved researchers and positions, outreach-tracker entries, feedback posts, and messages you send us.",
    "Technical data: your IP address and basic request logs (used for security and rate limiting), and small items stored in your browser — your session token, language and appearance choices.",
    "Payments: purchases are handled by Stripe. We keep the plan you bought, the amount and a transaction reference — never your card number.",
  ] },
  { t: "h2", text: "2. How we use it" },
  { t: "ul", items: [
    "To run Labora: show your profile, process applications and invitations, and keep your account secure.",
    "To match students and labs and to explain each match.",
    "To provide the tools you request, such as researcher summaries, the email checker and follow-up planning.",
    "To process payments and prevent abuse of referrals and free allowances.",
    "To understand how the product is used, fix problems and improve it.",
  ] },
  { t: "h2", text: "3. AI features and other services we rely on" },
  { t: "p", text: "Some features use an AI model provided by Anthropic. When you use them, the text needed to produce the result is sent to that provider: the draft you paste into the email checker or follow-up planner; your profile when you run AI Match; and — for professors — the ideal-student description you write, together with the profiles of students who have chosen to be discoverable. We instruct the model to judge only skills, interests, experience, availability and working style, and never names, schools, gender, nationality or other protected characteristics. AI output can be wrong, so please treat it as guidance." },
  { t: "p", text: "Researcher and paper information comes from OpenAlex, an open scholarly database; we send it the search terms you type. Payments are processed by Stripe. We use cloud hosting providers to run the service." },
  { t: "h2", text: "4. Who can see your information" },
  { t: "ul", items: [
    "Professors see the profile and message you send when you apply to their position, including your email address.",
    "Your profile is visible to verified professors only if you turn on discoverability. Even then, your email address stays hidden until you apply or accept an invitation. You can switch discoverability off at any time.",
    "Your outreach-tracker entries are private. Reply-rate statistics shown on researcher profiles are anonymous aggregates and never reveal individual entries.",
    "Position listings and lab pages of verified professors are public.",
    "We do not sell your personal information.",
  ] },
  { t: "h2", text: "5. Your choices and rights" },
  { t: "p", text: "You can edit your profile at any time, switch discoverability off, and delete your account from Settings — this permanently removes your profile, applications and related data. Payment processors may keep transaction records where the law requires. Depending on where you live you may also have the right to access, correct, export or object to the processing of your data; contact us and we will help." },
  { t: "h2", text: "6. Retention and security" },
  { t: "p", text: "We keep your information while your account is active. Passwords are stored as salted hashes, traffic is encrypted in transit, and access to data is restricted. No system is perfectly secure, so please use a strong, unique password." },
  { t: "h2", text: "7. Age and location" },
  { t: "p", text: "Labora is for university students and faculty aged 16 or over. Your information may be processed in countries other than your own; where required we use appropriate safeguards." },
  { t: "h2", text: "8. Changes and contact" },
  { t: "p", text: "If we make significant changes we'll tell you in the product. Questions or requests? Use the contact page and we'll get back to you." },
];

export const TERMS: Block[] = [
  { t: "p", text: "These terms govern your use of Labora. By creating an account or using the service you agree to them. If you don't agree, please don't use Labora." },
  { t: "h2", text: "1. Who can use Labora" },
  { t: "p", text: "You must be at least 16 and use a valid university email address. You're responsible for the accuracy of your information and for keeping your password secure. Professor accounts are reviewed before labs and positions become public; we may decline or revoke verification." },
  { t: "h2", text: "2. Using Labora fairly" },
  { t: "ul", items: [
    "Be honest: don't impersonate anyone or misrepresent your background, institution or openings.",
    "Be respectful: no harassment, spam or bulk unsolicited messaging.",
    "Respect people's data: don't scrape Labora, and use researcher information only to make genuine, courteous contact.",
    "Don't attempt to break, overload or bypass the security of the service.",
    "Professors must select students lawfully and without discrimination.",
  ] },
  { t: "h2", text: "3. Content you provide" },
  { t: "p", text: "You keep ownership of what you post. You give Labora permission to store, display and process it as needed to provide the service (for example, showing your position listing or sending your application to a professor). You confirm you have the right to share it." },
  { t: "h2", text: "4. Data, matches and AI output" },
  { t: "p", text: "Researcher and publication data comes from third-party sources and may be incomplete or out of date; affiliations can lag behind real life. Email addresses in the email finder are guesses based on common naming patterns and are not verified. Matches, scores, summaries and email feedback are generated automatically — sometimes with AI — and can contain errors. We do not guarantee any reply, position, offer or admission outcome." },
  { t: "h2", text: "5. Paid passes and referrals" },
  { t: "p", text: "Passes are one-time payments for a period of access (or lifetime access as described at purchase). They don't renew automatically. Prices, features and free allowances may change for future purchases. Referral rewards are granted at our discretion and may be withdrawn if we detect abuse. If something goes wrong with a payment, contact us." },
  { t: "h2", text: "6. Privacy" },
  { t: "p", text: "Our Privacy Policy explains how we handle your information and forms part of these terms." },
  { t: "h2", text: "7. Suspension and ending your account" },
  { t: "p", text: "You can delete your account at any time from Settings. We may suspend or remove accounts that break these terms or put others at risk." },
  { t: "h2", text: "8. Disclaimers and liability" },
  { t: "p", text: "Labora is provided “as is”. To the fullest extent permitted by law, we are not liable for indirect or consequential losses, or for the actions of users or third parties. Nothing in these terms limits liability that cannot be limited by law." },
  { t: "h2", text: "9. Changes and contact" },
  { t: "p", text: "We may update these terms; if changes are significant we'll let you know. Continued use after a change means you accept the updated terms. Questions? Use the contact page." },
];
