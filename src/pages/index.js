/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Link from "@docusaurus/Link";
import Translate, { translate } from "@docusaurus/Translate";
import useBaseUrl from "@docusaurus/useBaseUrl";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import React from "react";
import styles from "./index.module.css";

function Home() {
  const context = useDocusaurusContext();
  const { siteConfig: { customFields = {}, tagline } = {} } = context;
  return (
    <Layout title={tagline} description={customFields.description}>
      <main>
        <div className={styles.hero}>
          <div className={styles.heroInner}>
            <h1 className={styles.heroProjectTagline}>
              <img
                alt={translate({ message: "sea cucumber" })}
                className={styles.heroLogo}
                src={useBaseUrl("/img/profile.jpg")}
              />
              <span
                className={styles.heroTitleTextHtml}
                dangerouslySetInnerHTML={{
                  __html: translate({
                    id: "homepage.hero.title",
                    message:
                      "Read <b>fantastic</b> articles written by <b>programmable animal - sea cucumber</b>, level up your <b>skills</b> with ease",
                    description:
                      "Home page hero title, can contain simple html tags",
                  }),
                }}
              />
            </h1>
            <div className={styles.indexCtas}>
              <Link className="button button--primary" to="/blog">
                <Translate>Read articles</Translate>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}

export default Home;
