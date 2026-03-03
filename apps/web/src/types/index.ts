export type Run = { id: string; month: string; status: string; createdAt: string };
export type Post = { id: string; externalPostId: string; message: string; postedAt: string };
export type NewsletterSection = { id: string; type: string; contentMarkdown: string };
export type RunDetail = {
  run: {
    id: string;
    status: string;
    selections: { post: Post }[];
    sections: NewsletterSection[];
    draft: { markdown: string } | null;
  };
  posts: Post[];
};
