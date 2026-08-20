export type TourFlowKey = "requester" | "agent"

export type TourSceneId =
  | "login"
  | "inbox-home"
  | "inbox-create"
  | "inbox-track"
  | "ticket-detail"
  | "reset-help"
  | "inbox-queue"
  | "inbox-for-me"
  | "ticket-claim"
  | "ticket-progress"
  | "ticket-comment"
  | "ticket-hold"
  | "ticket-resolve"
  | "ticket-close"

export type TourHighlight =
  | "username"
  | "password"
  | "sign-in-btn"
  | "new-ticket-btn"
  | "ticket-form"
  | "create-btn"
  | "mine-tab"
  | "for-me-tab"
  | "ticket-row"
  | "queue-tab"
  | "claim-btn"
  | "status-field"
  | "comment-box"
  | "hold-reason"
  | "resolve-btn"
  | "close-btn"
  | "notifications"
  | "reset-help"
  | "timeline"

export type TourStep = {
  id: string
  scene: TourSceneId
  highlights: TourHighlight[]
  titleEn: string
  titleSi: string
  bodyEn: string
  bodySi: string
}

export const TOUR_FLOWS: Array<{
  key: TourFlowKey
  labelEn: string
  labelSi: string
  steps: TourStep[]
}> = [
  {
    key: "requester",
    labelEn: "Requester",
    labelSi: "ඉල්ලුම්කරු",
    steps: [
      {
        id: "1",
        scene: "login",
        highlights: [],
        titleEn: "Sign in to support-desk",
        titleSi: "support-desk වෙත පිවිසෙන්න",
        bodyEn:
          "Open support-desk and enter your username or employee number. Use your Orbit password or NIC as the password, then press Sign in.",
        bodySi:
          "support-desk විවෘත කර පරිශීලක නාමය හෝ සේවක අංකය ඇතුළත් කරන්න. Orbit මුරපදය හෝ NIC මුරපදය ලෙස භාවිතා කර Sign in ඔබන්න.",
      },
      {
        id: "2",
        scene: "inbox-home",
        highlights: ["new-ticket-btn"],
        titleEn: "Start a new ticket",
        titleSi: "නව ටිකට් එකක් අරඹන්න",
        bodyEn:
          "From the inbox, click New ticket in the sidebar or top bar. On desktop you can also press N on your keyboard.",
        bodySi:
          "Inbox එකෙන් sidebar හෝ top bar එකේ New ticket ඔබන්න. Desktop මත N යතුරද භාවිතා කළ හැක.",
      },
      {
        id: "3",
        scene: "inbox-create",
        highlights: ["ticket-form", "create-btn"],
        titleEn: "Fill in the ticket form",
        titleSi: "ටිකට් පෝරමය පුරවන්න",
        bodyEn:
          "Choose department, main issue, and sub issue (English and Sinhala labels). Add optional notes and priority, then press Create.",
        bodySi:
          "දෙපාර්තමේන්තුව, ප්‍රධාන සහ උප ගැටලුව තෝරන්න (ඉංග්‍රීසි/සිංහල). විකල්ප සටහන් සහ ප්‍රමුඛතාව එක් කර Create ඔබන්න.",
      },
      {
        id: "4",
        scene: "inbox-track",
        highlights: ["mine-tab", "ticket-row"],
        titleEn: "Track under I requested",
        titleSi: "I requested යටතේ අනුගමනය කරන්න",
        bodyEn:
          "Open I requested in the sidebar to see every ticket you filed. The table shows code, status, priority, and assignee.",
        bodySi:
          "ඔබ සාදන සියලු ටිකට් බැලීමට sidebar එකේ I requested විවෘත කරන්න. වගුවේ code, status, priority සහ assignee පෙනේ.",
      },
      {
        id: "5",
        scene: "ticket-detail",
        highlights: ["timeline"],
        titleEn: "Open a ticket for details",
        titleSi: "විස්තර සඳහා ටිකට් එක විවෘත කරන්න",
        bodyEn:
          "Click a row to open the ticket sheet. Read progress updates, comments, and status changes from your department.",
        bodySi:
          "පේළියක් ඔබා ටිකට් sheet එක විවෘත කරන්න. දෙපාර්තමේන්තුවේ ප්‍රගති යාවත්කාලීන, අදහස් සහ status වෙනස්කම් කියවන්න.",
      },
      {
        id: "6",
        scene: "reset-help",
        highlights: ["reset-help"],
        titleEn: "Locked out? Ask IT",
        titleSi: "පිවිසිය නොහැකිද? IT උදව් ඉල්ලන්න",
        bodyEn:
          "support-desk uses your Orbit password. If sign in still fails, use Request password reset help with your employee number. IT will contact you.",
        bodySi:
          "support-desk Orbit මුරපද භාවිතා කරයි. පිවිසීම අසාර්ථක නම් Request password reset help වෙත ගොස් සේවක අංකය යවන්න. IT ඔබව සම්බන්ධ කරයි.",
      },
    ],
  },
  {
    key: "agent",
    labelEn: "Agent",
    labelSi: "නියෝජිතයා",
    steps: [
      {
        id: "1",
        scene: "login",
        highlights: [],
        titleEn: "Sign in as an agent",
        titleSi: "නියෝජිතයෙකු ලෙස පිවිසෙන්න",
        bodyEn:
          "Agents use the same sign-in screen as everyone else — username or employee number with Orbit password or NIC.",
        bodySi:
          "නියෝජිතයන්ද අනෙක් අය මෙන්ම sign in තිරය භාවිතා කරයි — Orbit මුරපදය හෝ NIC සමඟ.",
      },
      {
        id: "2",
        scene: "inbox-queue",
        highlights: ["queue-tab", "ticket-row"],
        titleEn: "Open the department queue",
        titleSi: "දෙපාර්තමේන්තු Queue විවෘත කරන්න",
        bodyEn:
          "Queue lists new and unassigned tickets for your departments. Use filters for status, priority, or department.",
        bodySi:
          "Queue ඔබේ දෙපාර්තමේන්තුවල නව සහ unassigned ටිකට් පෙන්වයි. status, priority හෝ department අනුව filter කරන්න.",
      },
      {
        id: "3",
        scene: "inbox-for-me",
        highlights: ["for-me-tab", "ticket-row"],
        titleEn: "Check For me",
        titleSi: "For me පරීක්ෂා කරන්න",
        bodyEn:
          "For me shows tickets already assigned to you. Switch between Queue and For me from the sidebar views.",
        bodySi:
          "For me ඔබට දැනටමත් පැවරූ ටිකට් පෙන්වයි. sidebar views වලින් Queue සහ For me අතර මාරු වන්න.",
      },
      {
        id: "4",
        scene: "ticket-claim",
        highlights: ["claim-btn"],
        titleEn: "Claim or assign",
        titleSi: "භාරගන්න හෝ පවරන්න",
        bodyEn:
          "Open a ticket from the queue and press Claim, or reassign it to another agent in the Reassign dropdown.",
        bodySi:
          "Queue එකෙන් ටිකට් විවෘත කර Claim ඔබන්න, නැතහොත් Reassign dropdown එකෙන් වෙනත් නියෝජිතයෙකුට පවරන්න.",
      },
      {
        id: "5",
        scene: "ticket-progress",
        highlights: ["status-field"],
        titleEn: "Set status to In progress",
        titleSi: "Status In progress කරන්න",
        bodyEn:
          "When you start working, tap In progress under Actions so the requester sees that work has begun.",
        bodySi:
          "වැඩ අරඹන විට Actions යට In progress ඔබන්න — ඉල්ලුම්කරුට වැඩ ආරම්භ වූ බව පෙනේ.",
      },
      {
        id: "6",
        scene: "ticket-comment",
        highlights: ["comment-box"],
        titleEn: "Post a progress update",
        titleSi: "ප්‍රගති යාවත්කාලීනයක් එක් කරන්න",
        bodyEn:
          "Write a public progress update in the comment box and post it. Use internal notes for team-only messages.",
        bodySi:
          "comment box එකේ public progress update ලියා post කරන්න. කණ්ඩායමට පමණ internal notes භාවිතා කරන්න.",
      },
      {
        id: "7",
        scene: "ticket-hold",
        highlights: ["hold-reason", "status-field"],
        titleEn: "Put on hold if blocked",
        titleSi: "අවහිර නම් On hold කරන්න",
        bodyEn:
          "Waiting on parts, access, or another team? Set On hold and enter a clear reason the requester can understand.",
        bodySi:
          "කොටස්, access හෝ වෙනත් කණ්ඩායමක් බලාපොරොත්තු වෙනවාද? On hold කර ඉල්ලුම්කරුට තේරෙන හේතුව ලියන්න.",
      },
      {
        id: "8",
        scene: "ticket-resolve",
        highlights: ["resolve-btn", "notifications"],
        titleEn: "Resolve the ticket",
        titleSi: "ටිකට් එක විසඳන්න",
        bodyEn:
          "When the job is done, set status to Resolved. The requester is notified by email and SMS automatically.",
        bodySi:
          "වැඩ අවසන් වූ විට status Resolved කරන්න. ඉල්ලුම්කරුට email සහ SMS ස්වයංක්‍රීයව යයි.",
      },
      {
        id: "9",
        scene: "ticket-close",
        highlights: ["close-btn"],
        titleEn: "Close to finish",
        titleSi: "අවසන් කිරීමට Close කරන්න",
        bodyEn:
          "After confirmation or when no further action is needed, move the ticket to Closed to complete the lifecycle.",
        bodySi:
          "තහවුරු කිරීමෙන් පසු හෝ වැඩ තවත් නොතිබේ නම් ticket Closed කර lifecycle එක අවසන් කරන්න.",
      },
    ],
  },
]
