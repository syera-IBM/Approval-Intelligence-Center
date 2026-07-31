import { createBrowserRouter } from "react-router";
import Root from "./Root";
import IndustrySelect from "./pages/IndustrySelect";
import FunctionalAreaPage from "./pages/FunctionalAreaPage";
import ModuleSelectPage from "./pages/ModuleSelectPage";
import FunctionalAreaHub from "./pages/FunctionalAreaHub";
import Home from "./pages/Home";
import Approvals from "./pages/Approvals";
import Decks from "./pages/Decks";
import Process from "./pages/Process";
import Webinar from "./pages/Webinar";
import ApprovalType from "./pages/ApprovalType";
import Questionnaire from "./pages/Questionnaire";
import DiscoveryQuestions from "./pages/DiscoveryQuestions";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      // ── Top-level landing (industry picker)
      { index: true, Component: IndustrySelect },

      // ── Industry → FA picker
      { path: "industry/:industrySlug", Component: FunctionalAreaPage },

      // ── FA-level: show only the 5 modules
      { path: "industry/:industrySlug/:faSlug", Component: ModuleSelectPage },

      // ── Module-level: show 4 resource tiles + requirements questionnaire
      { path: "industry/:industrySlug/:faSlug/:moduleSlug", Component: FunctionalAreaHub },

      // ── Legacy approval type routes (reachable from FunctionalAreaHub module activities)
      { path: "approval/:type",            Component: ApprovalType },
      { path: "approval/:type/discovery",  Component: DiscoveryQuestions },

      // ── Standalone pages
      { path: "home",          Component: Home },
      { path: "questionnaire", Component: Questionnaire },
      { path: "approvals",     Component: Approvals },
      { path: "decks",         Component: Decks },
      { path: "process",       Component: Process },
      { path: "webinar",       Component: Webinar },
    ],
  },
]);
