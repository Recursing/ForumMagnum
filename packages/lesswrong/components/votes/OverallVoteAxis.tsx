import { Components, registerComponent, getCollection } from '../../lib/vulcan-lib';
import React from 'react';
import { userIsAdmin } from '../../lib/vulcan-users/permissions';
import moment from '../../lib/moment-timezone';
import { useCurrentUser } from '../common/withUser';
import { forumTypeSetting, isEAForum } from '../../lib/instanceSettings';
import { Comments } from '../../lib/collections/comments/collection';
import { userCanVote } from '../../lib/collections/users/helpers';
import { Posts } from '../../lib/collections/posts/collection';
import { Revisions } from '../../lib/collections/revisions/collection';
import classNames from 'classnames';
import type { VotingProps } from './withVote';

const styles = (theme: ThemeType): JssStyles => ({
  overallSection: {
    display: 'inline-block',
    height: 24,
    paddingTop: 2
  },
  overallSectionBox: {
    marginLeft: 8,
    outline: theme.palette.border.commentBorder,
    borderRadius: isEAForum ? theme.borderRadius.small : 2,
    textAlign: 'center',
    minWidth: 60
  },
  vote: {
    fontSize: 25,
    lineHeight: 0.6,
    whiteSpace: "nowrap",
    display: "inline-block"
  },
  voteScore: {
    fontSize: '1.1rem',
    marginLeft: 4,
    marginRight: 4,
    lineHeight: 1,
  },
  secondarySymbol: {
    fontFamily: theme.typography.body1.fontFamily,
  },
  secondaryScore: {
    fontSize: '1.1rem',
    marginLeft: 2,
    marginRight: 14
  },
  secondaryScoreNumber: {
    marginLeft: 3,
  },
  tooltipHelp: {
    fontSize: '1rem',
    fontStyle: "italic"
  }
})

const OverallVoteAxis = ({ document, hideKarma=false, voteProps, classes, showBox=false }: {
  document: VoteableTypeClient,
  hideKarma?: boolean,
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType,
  showBox?: boolean
}) => {
  const currentUser = useCurrentUser();
  
  if (!document) return null;

  const { OverallVoteButton, LWTooltip } = Components

  const collection = getCollection(voteProps.collectionName);
  const extendedScore = voteProps.document?.extendedScore
  const voteCount = extendedScore && ("approvalVoteCount" in extendedScore)
    ? extendedScore.approvalVoteCount
    : (voteProps.voteCount || 0);
  const karma = voteProps.baseScore;
  const {fail, reason: whyYouCantVote} = userCanVote(currentUser);
  const canVote = !fail;

  let moveToAlignnmentUserId = ""
  let documentTypeName = "comment";
  if (collection == Comments) {
    const comment = document as CommentsList
    moveToAlignnmentUserId = comment.moveToAlignmentUserId
  }
  if (collection == Posts) {
    documentTypeName = "post";
  }
  if (collection == Revisions) {
    documentTypeName = "revision";
  }

  const af = (document as any).af;
  const afDate = (document as any).afDate;
  const afBaseScore = (document as any).afBaseScore;
  
  const moveToAfInfo = userIsAdmin(currentUser) && !!moveToAlignnmentUserId && (
    <div className={classes.tooltipHelp}>
      <span>Moved to AF by <Components.UsersName documentId={moveToAlignnmentUserId }/> on { afDate && moment(new Date(afDate)).format('YYYY-MM-DD') }</span>
    </div>
  )

  const karmaTooltipTitle = hideKarma
    ? 'This post has disabled karma visibility'
    : <div>This {documentTypeName} has {karma} <b>overall</b> karma ({voteCount} {voteCount == 1 ? "Vote" : "Votes"})</div>

  const TooltipIfDisabled = (canVote
    ? ({children}: {children: React.ReactNode}) => <>{children}</>
    : ({children}: {children: React.ReactNode}) => <LWTooltip
      placement="top"
      title={<>
        <div>{whyYouCantVote}</div>
        <div>{karmaTooltipTitle}</div>
      </>}
    >
      {children}
    </LWTooltip>
  )
  const TooltipIfEnabled = (canVote
    ? ({children, ...props}: React.ComponentProps<typeof LWTooltip>) => <LWTooltip {...props}>
      {children}
    </LWTooltip>
    : ({children}: {children: React.ReactNode}) => <>{children}</>
  );

  return <TooltipIfDisabled>
    <span className={classes.vote}>
      {!!af && forumTypeSetting.get() !== 'AlignmentForum' &&
        <LWTooltip placement="bottom" title={
          <div>
            <p>AI Alignment Forum Karma</p>
            { moveToAfInfo }
          </div>
        }>
          <span className={classes.secondaryScore}>
            <span className={classes.secondarySymbol}>Ω</span>
            <span className={classes.secondaryScoreNumber}>{afBaseScore || 0}</span>
          </span>
        </LWTooltip>
      }
      {!af && (forumTypeSetting.get() === 'AlignmentForum') &&
        <LWTooltip title="LessWrong Karma" placement="bottom">
          <span className={classes.secondaryScore}>
            <span className={classes.secondarySymbol}>LW</span>
            <span className={classes.secondaryScoreNumber}>{document.baseScore || 0}</span>
          </span>
        </LWTooltip>
      }
      {(forumTypeSetting.get() !== 'AlignmentForum' || !!af) &&
        <span className={classNames(classes.overallSection, {[classes.overallSectionBox]: showBox})}>
          <TooltipIfEnabled
            title={<div><b>Overall Karma: Downvote</b><br />How much do you like this overall?<br /><em>For strong downvote, click-and-hold<br />(Click twice on mobile)</em></div>}
            placement="bottom"
          >
            <OverallVoteButton
              orientation="left"
              color="error"
              upOrDown="Downvote"
              enabled={canVote}
              {...voteProps}
            />
          </TooltipIfEnabled>
          <TooltipIfEnabled title={karmaTooltipTitle} placement="bottom">
            {hideKarma
              ? <span>{' '}</span>
              : <span className={classes.voteScore}>
                  {karma}
                </span>
            }
          </TooltipIfEnabled>
          <TooltipIfEnabled
            title={<div><b>Overall Karma: Upvote</b><br />How much do you like this overall?<br /><em>For strong upvote, click-and-hold<br />(Click twice on mobile)</em></div>}
            placement="bottom"
          >
            <OverallVoteButton
              orientation="right"
              color="secondary"
              upOrDown="Upvote"
              enabled={canVote}
              {...voteProps}
            />
          </TooltipIfEnabled>
        </span>
      }
    </span>
  </TooltipIfDisabled>
}

const OverallVoteAxisComponent = registerComponent('OverallVoteAxis', OverallVoteAxis, {styles});

declare global {
  interface ComponentTypes {
    OverallVoteAxis: typeof OverallVoteAxisComponent
  }
}
