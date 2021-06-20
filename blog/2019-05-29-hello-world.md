---
slug: hello-world
title: Hello
author: Endilie Yacop Sucipto
author_title: Maintainer of Docusaurus
author_url: https://github.com/endiliey
author_image_url: https://avatars1.githubusercontent.com/u/17883920?s=460&v=4
tags: [hello, docusaurus]
---

Welcome to this blog. This blog is created with [**Docusaurus 2**](https://docusaurus.io/).

<!--truncate-->

This is a test post.

A whole bunch of other information.

```jsx live
function Clock(props) {
  const [date, setDate] = useState(new Date());
  useEffect(() => {
    var timerID = setInterval(() => tick(), 1000);

    return function cleanup() {
      clearInterval(timerID);
    };
  });

  function tick() {
    setDate(new Date());
  }

  return (
    <div>
      <h2>It is {date.toLocaleTimeString()}.</h2>
    </div>
  );
}
```
