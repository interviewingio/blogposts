This post is special because it features a highly interactive data visualization. There are 3 files in this directory that you need to get things going. They are post.css, post.html, and post.js. In order to get the interactive visualization in the post to run, you need to structure your HTML and incorporate these files as follows:

```
<html>
  <head>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.min.js"></script>
    <style>
      <!-- contents of post.css -->
    </style>
  </head>
  <body>
    <!-- contents of post.html -->
    <script>
      <!-- contents of post.js -->
    </script>
  </body>
</html>
```

Note that some of the markup in `post.html` is specific to the blog's styling and won't carry over. The section that must be reproduced as-is is commented accordingly.