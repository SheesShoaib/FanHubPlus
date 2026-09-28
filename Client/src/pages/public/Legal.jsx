import { useLocation } from "react-router-dom";

import SectionTitle from "../../components/common/SectionTitle";

const PAGES = {
  "/terms": {
    title: "Terms of Use",
    sections: [
      ["Using FanHub+", "FanHub+ is a fan information hub. You can browse as a visitor or create a free account to bookmark, rate, take notes and submit fan content."],
      ["Your content", "Fan submissions must be your own work. Admins review every submission before it is published and may decline anything that is off-topic, abusive or infringes someone else's rights."],
      ["Merchandise", "The merchandise showcase is for display and discovery only. FanHub+ does not sell products, process orders or take payments."],
      ["Accounts", "Keep your password private. Accounts that abuse the platform may be blocked by an administrator."],
    ],
  },
  "/privacy": {
    title: "Privacy Policy",
    sections: [
      ["What we store", "Your name, email, hashed password, favourite fandoms, display preferences and the things you create on the site (bookmarks, notes, ratings, submissions, chat history and feedback)."],
      ["Analytics", "We count page views with an anonymous browser id to understand which areas of the site are popular. We don't use advertising trackers."],
      ["Location", "If you choose \"Use my location\" on the Events page, your coordinates are used in your browser and in a single request to find nearby events. They are not saved."],
      ["Your control", "You can edit your profile at any time and delete notes, bookmarks and chat history from your dashboard."],
    ],
  },
};

function Legal() {
  const { pathname } = useLocation();
  const page = PAGES[pathname] || PAGES["/terms"];

  return (
    <div className="site-container fh-page fh-legal">
      <SectionTitle eyebrow="FanHub+" title={page.title} />
      {page.sections.map(([heading, text]) => (
        <section key={heading}>
          <h2>{heading}</h2>
          <p>{text}</p>
        </section>
      ))}
    </div>
  );
}

export default Legal;
