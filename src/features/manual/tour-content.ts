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
          "Click New ticket in the top bar (top right). On desktop you can also press N on your keyboard.",
        bodySi:
          "ඉහළ bar එකේ (දකුණු පස) ඇති New ticket තෝරන්න. Desktop පරිගණකයකදී යතුරුපුවරුවේ N යතුර එබීමෙන්ද නව ටිකට් එකක් ආරම්භ කළ හැක.",
      },
      {
        id: "3",
        scene: "inbox-create",
        highlights: ["ticket-form", "create-btn"],
        titleEn: "Fill in the ticket form",
        titleSi: "ටිකට් පෝරමය පුරවන්න",
        bodyEn:
          "Pick the Department, Issue and Sub issue from the dropdowns (English and Sinhala). If an issue has only one sub issue it is filled in for you. Choose a priority, add a description, then press Create ticket (or Ctrl + Enter). The department team gets an SMS right away.",
        bodySi:
          "Dropdown මගින් Department, Issue සහ Sub issue තෝරන්න (ඉංග්‍රීසි සහ සිංහල). Issue එකකට ඇත්තේ එක් Sub issue එකක් පමණක් නම් එය ස්වයංක්‍රීයව තේරේ. ප්‍රමුඛතාව (Priority) තෝරා, අවශ්‍ය නම් සටහන් එක් කර Create ticket ඔබන්න (නැතහොත් Ctrl + Enter). දෙපාර්තමේන්තු කණ්ඩායමට වහාම SMS එකක් ලැබේ.",
      },
      {
        id: "4",
        scene: "inbox-track",
        highlights: ["mine-tab", "ticket-row"],
        titleEn: "Track under My Tickets",
        titleSi: "My Tickets යටතේ ඔබගේ ටිකට් අනුගමනය කරන්න",
        bodyEn:
          "Open My Tickets in the top bar. Active tickets show by default — use the Resolved, Closed or All tabs to see finished ones. Each row shows the title, code, status, priority, assignee and when it was last updated.",
        bodySi:
          "ඉහළ bar එකේ My Tickets තෝරන්න. පෙරනිමියෙන් ක්‍රියාත්මක (Active) ටිකට් පමණක් පෙන්වයි — අවසන් වූ ටිකට් බැලීමට Resolved, Closed හෝ All tab තෝරන්න. සෑම පේළියකම මාතෘකාව, ටිකට් අංකය, තත්ත්වය, ප්‍රමුඛතාව, පැවරී ඇති නියෝජිතයා සහ අවසන් යාවත්කාලීන වේලාව පෙන්වයි.",
      },
      {
        id: "5",
        scene: "ticket-detail",
        highlights: ["timeline"],
        titleEn: "Open a ticket for details",
        titleSi: "විස්තර බැලීමට ටිකට් එක විවෘත කරන්න",
        bodyEn:
          "Click a row to open the ticket. The Conversation reads like a chat — your messages on the right, the team's on the left, status changes in between. Reply in the box at the bottom; type @name to notify someone.",
        bodySi:
          "පේළිය තෝරා ටිකට් එක විවෘත කරන්න. Conversation කොටස chat එකක් මෙන් පෙන්වයි — ඔබගේ පණිවිඩ දකුණු පස, කණ්ඩායමේ පණිවිඩ වම් පස, තත්ත්ව වෙනස්කම් ඒ අතර. පහළ ඇති කොටුවේ පිළිතුරු ලියන්න; කෙනෙකුට දැනුම් දීමට @නම ලෙස ටයිප් කරන්න.",
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
          "Queue (top bar) shows active tickets for your departments. Use the status tabs, Priority and Department filters, and the Overdue or Unassigned buttons to narrow it down. You also get an SMS when a new ticket arrives.",
        bodySi:
          "ඉහළ bar එකේ Queue මගින් ඔබගේ දෙපාර්තමේන්තුවල ක්‍රියාත්මක ටිකට් පෙන්වයි. Status tabs, Priority සහ Department filters, සහ Overdue හෝ Unassigned බොත්තම් භාවිතා කර ටිකට් ඉක්මනින් සොයා ගන්න. නව ටිකට් එකක් ලැබුණු විට ඔබට SMS එකක්ද ලැබේ.",
      },
      {
        id: "3",
        scene: "inbox-for-me",
        highlights: ["for-me-tab", "ticket-row"],
        titleEn: "Check For me",
        titleSi: "For me පරීක්ෂා කරන්න",
        bodyEn:
          "For me shows tickets assigned to you. Switch between For me, My Tickets and Queue using the tabs in the top bar — the numbers show how many active tickets each has.",
        bodySi:
          "For me මගින් ඔබට පවරා ඇති ටිකට් පෙන්වයි. ඉහළ bar එකේ tabs භාවිතා කර For me, My Tickets සහ Queue අතර මාරු වන්න — එක් එක් tab එකේ ඇති අංකයෙන් ක්‍රියාත්මක ටිකට් ගණන පෙන්වයි.",
      },
      {
        id: "4",
        scene: "ticket-claim",
        highlights: ["claim-btn"],
        titleEn: "Claim or assign",
        titleSi: "ටිකට් භාරගන්න හෝ පවරන්න",
        bodyEn:
          "Press Claim on the queue row, or open the ticket and press Claim next to Owner. To give it to someone else, pick them in the Owner dropdown and press Confirm.",
        bodySi:
          "Queue පේළියේ ඇති Claim ඔබන්න, නැතහොත් ටිකට් එක විවෘත කර Owner අසල ඇති Claim ඔබන්න. වෙනත් නියෝජිතයෙකුට පැවරීමට Owner dropdown එකෙන් ඔවුන් තෝරා Confirm ඔබන්න.",
      },
      {
        id: "5",
        scene: "ticket-progress",
        highlights: ["status-field"],
        titleEn: "Press Start work",
        titleSi: "Start work ඔබන්න",
        bodyEn:
          "When you begin, press Start work. The highlighted button is always the usual next step. The requester is emailed about each status change.",
        bodySi:
          "වැඩ ආරම්භ කරන විට Start work ඔබන්න. උද්දීපනය කළ (තද පැහැති) බොත්තම සැමවිටම සාමාන්‍ය ඊළඟ පියවරයි. සෑම තත්ත්ව වෙනසක් ගැනම ඉල්ලුම්කරුට email මගින් දැනුම් දෙනු ලැබේ.",
      },
      {
        id: "6",
        scene: "ticket-comment",
        highlights: ["comment-box"],
        titleEn: "Post a progress update",
        titleSi: "ප්‍රගති යාවත්කාලීනයක් එක් කරන්න",
        bodyEn:
          "Type in the box at the bottom of the ticket and press Enter or Send (Shift + Enter for a new line). Tick Internal note for team-only messages; they show in purple. Type @name to notify someone by email, or SMS if they have no email.",
        bodySi:
          "ටිකට් එකේ පහළ ඇති කොටුවේ ලියා Enter හෝ Send ඔබන්න (නව පේළියකට Shift + Enter). කණ්ඩායමට පමණක් දැකිය යුතු පණිවිඩ සඳහා Internal note සලකුණු කරන්න. ඒවා දම් පැහැයෙන් පෙන්වයි. කෙනෙකුට email මගින් (email නොමැති නම් SMS මගින්) දැනුම් දීමට @නම ලෙස ටයිප් කරන්න.",
      },
      {
        id: "7",
        scene: "ticket-hold",
        highlights: ["hold-reason", "status-field"],
        titleEn: "Put on hold if blocked",
        titleSi: "වැඩ කටයුතු අවහිර වී ඇත්නම් On hold කරන්න",
        bodyEn:
          "Waiting on parts, access, or another team? Press Put on hold and enter a clear reason. The requester is emailed the reason, and the ticket owner is emailed if someone else put it on hold.",
        bodySi:
          "අමතර කොටස්, ප්‍රවේශ අවසර හෝ වෙනත් කණ්ඩායමක සහාය බලාපොරොත්තු වන්නේ නම් Put on hold ඔබා පැහැදිලි හේතුවක් ඇතුළත් කරන්න. ඉල්ලුම්කරුට එම හේතුව email මගින් ලැබේ; වෙනත් අයෙකු On hold කළහොත් ටිකට් එකේ Owner හටද email එකක් ලැබේ.",
      },
      {
        id: "8",
        scene: "ticket-resolve",
        highlights: ["resolve-btn", "notifications"],
        titleEn: "Resolve the ticket",
        titleSi: "ටිකට් එක විසඳන්න",
        bodyEn:
          "When the job is done, press Resolve. The requester is notified by email and SMS automatically. If it turns out not to be fixed, press Reopen.",
        bodySi:
          "වැඩ කටයුතු සම්පූර්ණ වූ පසු Resolve ඔබන්න. ඉල්ලුම්කරුට email සහ SMS මගින් ස්වයංක්‍රීයව දැනුම් දෙනු ලැබේ. ගැටලුව තවමත් විසඳී නොමැති නම් Reopen ඔබන්න.",
      },
      {
        id: "9",
        scene: "ticket-close",
        highlights: ["close-btn"],
        titleEn: "Close to finish",
        titleSi: "අවසන් කිරීමට Close කරන්න",
        bodyEn:
          "Once the requester confirms, or no further action is needed, press Close ticket. It shows as Resolved · Closed and moves out of the Active lists (find it under Closed).",
        bodySi:
          "ඉල්ලුම්කරු තහවුරු කළ පසු හෝ තවදුරටත් ක්‍රියාමාර්ගයක් අවශ්‍ය නොවන විට Close ticket ඔබන්න. එය Resolved · Closed ලෙස පෙන්වන අතර Active ලැයිස්තුවෙන් ඉවත් වේ (Closed tab යටතේ සොයාගත හැක).",
      },
    ],
  },
]
