import React from "react";
import clsx from "clsx";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";

const allPosts = ((ctx) => {
  /** @type {string[]} */
  const blogpostNames = ctx.keys();

  return blogpostNames.reduce((blogposts, blogpostName, i) => {
    const module = ctx(blogpostName);
    const { date, formattedDate, title, permalink } = module.metadata;
    return [
      ...blogposts,
      {
        date,
        formattedDate,
        title,
        permalink,
      },
    ];
  }, /** @type {string[]}>} */([]));
})(require.context("../../treasure", false, /.md/));

const postsByYear = allPosts.reduceRight((posts, post) => {
  const year = post.date.split("-")[0];
  const yearPosts = posts.get(year) || [];
  return posts.set(year, [post, ...yearPosts]);
}, /** @type {Map<string, BlogPost[]>}>} */(new Map()));

const yearsOfPosts = Array.from(postsByYear, ([year, posts]) => ({
  year,
  posts,
}));

function Year(
  /** @type {{ year: string; posts: BlogPost[]}} */ { year, posts }
) {
  return (
    <div className={clsx("col col--4")}>
      <h3>{year}</h3>
      <ul>
        {posts.map((post) => (
          <li key={post.date}>
            <Link to={post.permalink}>
              {post.formattedDate} - {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
function Treasure() {
  return (
    <Layout title="Treasure">
      <header className={clsx("hero hero--primary")}>
        <div className="container">
          <h1 className="hero__title">Treasure</h1>
          <p className="hero__subtitle">bookmarked</p>
        </div>
      </header>
      <main>
        {yearsOfPosts && yearsOfPosts.length > 0 && (
          <section>
            <div className="container">
              <div className="row">
                {yearsOfPosts.map((props, idx) => (
                  <Year key={idx} {...props} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </Layout>
  );
}

export default Treasure;
