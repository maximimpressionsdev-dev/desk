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
          "support-desk විවෘත කර ඔබගේ පරිශීලක නාමය හෝ සේවක අංකය ඇතුළත් කරන්න. මුරපදය ලෙස ඔබගේ Orbit මුරපදය හෝ NIC අංකය භාවිතා කර Sign in ඔබන්න.",
      },
      {
        id: "2",
        scene: "inbox-home",
        highlights: ["new-ticket-btn"],
        titleEn: "Start a new ticket",
        titleSi: "නව ටිකට් එකක් ආරම්භ කරන්න",
        bodyEn:
          "From the inbox, click New ticket in the sidebar or top bar. On desktop you can also press N on your keyboard.",
        bodySi:
          "Inbox එකෙන් sidebar එකේ හෝ ඉහළ bar එකේ New ticket තෝරන්න. Desktop පරිගණකයකදී යතුරුපුවරුවේ N යතුර එබීමෙන්ද නව ටිකට් එකක් ආරම්භ කළ හැක.",
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
          "අදාළ දෙපාර්තමේන්තුව, ප්‍රධාන ගැටලුව සහ උප ගැටලුව තෝරන්න. අවශ්‍ය නම් අමතර සටහන් සහ ප්‍රමුඛතාවද එක් කරන්න. ඉන්පසු Create ඔබන්න.",
      },
      {
        id: "4",
        scene: "inbox-track",
        highlights: ["mine-tab", "ticket-row"],
        titleEn: "Track under My Tickets",
        titleSi: "My Tickets යටතේ ඔබගේ ටිකට් අනුගමනය කරන්න",
        bodyEn:
          "Open My Tickets in the sidebar to see every ticket you filed. The table shows code, status, priority, and assignee.",
        bodySi:
          "ඔබ විසින් ඉදිරිපත් කළ සියලුම ටිකට් බැලීමට sidebar එකේ My Tickets තෝරන්න. එහි ඇති වගුවෙන් ටිකට් අංකය (code), තත්ත්වය (status), ප්‍රමුඛතාව (priority) සහ පැවරී ඇති නියෝජිතයා (assignee) බැලිය හැක.",
      },
      {
        id: "5",
        scene: "ticket-detail",
        highlights: ["timeline"],
        titleEn: "Open a ticket for details",
        titleSi: "විස්තර බැලීමට ටිකට් එක විවෘත කරන්න",
        bodyEn:
          "Click a row to open the ticket sheet. Read progress updates, comments, and status changes from your department.",
        bodySi:
          "අදාළ පේළිය තෝරා ටිකට් විස්තර විවෘත කරන්න. ඔබගේ දෙපාර්තමේන්තුවෙන් ලබා දී ඇති ප්‍රගති යාවත්කාලීන, අදහස් සහ තත්ත්වයේ වෙනස්කම් එහිදී බැලිය හැක.",
      },
      {
        id: "6",
        scene: "reset-help",
        highlights: ["reset-help"],
        titleEn: "Locked out? Ask IT",
        titleSi: "පද්ධතියට පිවිසීමට නොහැකිද? IT සහාය ඉල්ලන්න",
        bodyEn:
          "support-desk uses your Orbit password. If sign in still fails, use Request password reset help with your employee number. IT will contact you.",
        bodySi:
          "support-desk සඳහා ඔබගේ Orbit මුරපදය භාවිතා කරයි. Sign in කිරීමට තවමත් නොහැකි නම්, Request password reset help තෝරා ඔබගේ සේවක අංකය ලබා දෙන්න. ඉන්පසු IT කණ්ඩායම ඔබව සම්බන්ධ කර ගනු ඇත.",
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
          "නියෝජිතයන් සඳහාද අනෙකුත් පරිශීලකයන් භාවිතා කරන Sign in තිරයම භාවිතා කරයි. ඔබගේ පරිශීලක නාමය හෝ සේවක අංකය ඇතුළත් කර, මුරපදය ලෙස Orbit මුරපදය හෝ NIC අංකය භාවිතා කරන්න.",
      },
      {
        id: "2",
        scene: "inbox-queue",
        highlights: ["queue-tab", "ticket-row"],
        titleEn: "Open the department queue",
        titleSi: "දෙපාර්තමේන්තු Queue එක විවෘත කරන්න",
        bodyEn:
          "Queue lists new and unassigned tickets for your departments. Use filters for status, priority, or department.",
        bodySi:
          "Queue එකෙන් ඔබට අදාළ දෙපාර්තමේන්තුවල නව සහ තවමත් නියෝජිතයෙකුට පවරා නොමැති ටිකට් බැලිය හැක. අවශ්‍ය ටිකට් ඉක්මනින් සොයා ගැනීමට status, priority හෝ department අනුව filters භාවිතා කරන්න.",
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
          "For me මගින් දැනටමත් ඔබට පවරා ඇති ටිකට් බැලිය හැක. Sidebar එකේ ඇති views භාවිතා කර Queue සහ For me අතර මාරු වන්න.",
      },
      {
        id: "4",
        scene: "ticket-claim",
        highlights: ["claim-btn"],
        titleEn: "Claim or assign",
        titleSi: "ටිකට් භාරගන්න හෝ පවරන්න",
        bodyEn:
          "Open a ticket from the queue and press Claim, or reassign it to another agent in the Reassign dropdown.",
        bodySi:
          "Queue එකෙන් ටිකට් එකක් විවෘත කර Claim ඔබා එය ඔබ වෙත භාරගන්න. එසේ නොමැති නම් Reassign dropdown එක භාවිතා කර ටිකට් එක වෙනත් නියෝජිතයෙකුට පවරන්න.",
      },
      {
        id: "5",
        scene: "ticket-progress",
        highlights: ["status-field"],
        titleEn: "Set status to In progress",
        titleSi: "තත්ත්වය In progress ලෙස සකසන්න",
        bodyEn:
          "When you start working, tap In progress under Actions so the requester sees that work has begun.",
        bodySi:
          "ටිකට් එක සම්බන්ධයෙන් වැඩ ආරම්භ කළ පසු Actions යටතේ ඇති In progress තෝරන්න. එවිට වැඩ කටයුතු ආරම්භ කර ඇති බව ඉල්ලුම්කරුට දැනගත හැක.",
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
          "Comment box එකේ ඉල්ලුම්කරුට දැකිය හැකි ප්‍රගති යාවත්කාලීනයක් ලියා Post කරන්න. කණ්ඩායමේ සාමාජිකයන්ට පමණක් දැකිය යුතු පණිවිඩ සඳහා Internal notes භාවිතා කරන්න.",
      },
      {
        id: "7",
        scene: "ticket-hold",
        highlights: ["hold-reason", "status-field"],
        titleEn: "Put on hold if blocked",
        titleSi: "වැඩ කටයුතු අවහිර වී ඇත්නම් On hold කරන්න",
        bodyEn:
          "Waiting on parts, access, or another team? Set On hold and enter a clear reason the requester can understand.",
        bodySi:
          "අමතර කොටස්, ප්‍රවේශ අවසර හෝ වෙනත් කණ්ඩායමක සහාය බලාපොරොත්තු වන්නේ නම්, ටිකට් එක On hold ලෙස සකසන්න. එසේ කරන විට ඉල්ලුම්කරුට පහසුවෙන් තේරුම් ගත හැකි පැහැදිලි හේතුවක් සඳහන් කරන්න.",
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
          "වැඩ කටයුතු සම්පූර්ණ වූ පසු ටිකට් එකේ status එක Resolved ලෙස සකසන්න. එවිට ඉල්ලුම්කරුට email සහ SMS මගින් ස්වයංක්‍රීයව දැනුම්දීමක් ලැබේ.",
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
          "ඉල්ලුම්කරුගෙන් තහවුරු කිරීම ලැබුණු පසු හෝ තවදුරටත් ක්‍රියාමාර්ගයක් අවශ්‍ය නොවන විට, ටිකට් එක Closed ලෙස සකසන්න. එමගින් ටිකට් එකේ ක්‍රියාවලිය සම්පූර්ණ වේ.",
      },
    ],
  },
]
