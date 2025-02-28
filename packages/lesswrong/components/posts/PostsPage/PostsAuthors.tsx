import React from 'react'
import { forumTypeSetting } from '../../../lib/instanceSettings';
import { registerComponent, Components } from '../../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    fontFamily: theme.typography.uiSecondary.fontFamily,
    textAlign: 'left',
    display: 'inline',
  },
  authorName: {
    fontWeight: 600,
    marginLeft: forumTypeSetting.get() === 'EAForum' ? 1 : 0,
  },
})

const PostsAuthors = ({classes, post}: {
  classes: ClassesType,
  post: PostsDetails,
}) => {
  const { UsersName, PostsCoauthor, Typography } = Components
  return <Typography variant="body1" component="span" className={classes.root}>
    by <span className={classes.authorName}>
      {!post.user || post.hideAuthor ? <Components.UserNameDeleted/> : <UsersName user={post.user} allowNewUserIcon />}
      {post.coauthors?.map(coauthor =>
        <PostsCoauthor key={coauthor._id} post={post} coauthor={coauthor} />
      )}
    </span>
  </Typography>
}

const PostsAuthorsComponent = registerComponent('PostsAuthors', PostsAuthors, {styles});

declare global {
  interface ComponentTypes {
    PostsAuthors: typeof PostsAuthorsComponent
  }
}
