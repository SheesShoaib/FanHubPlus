import SectionTitle from "../../components/common/SectionTitle";
import Sitemap from "../../components/home/Sitemap";

function SitemapPage() {
  return (
    <div className="site-container fh-page">
      <SectionTitle
        eyebrow="Sitemap"
        title="Everything on FanHub+"
        subtitle="Visitors can browse all public pages. Member pages need a free account, and admin pages need an administrator login."
      />
      <Sitemap />
    </div>
  );
}

export default SitemapPage;
