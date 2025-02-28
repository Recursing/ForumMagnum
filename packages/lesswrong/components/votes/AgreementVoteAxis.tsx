import React from 'react';
import { Components, registerComponent, getCollection } from '../../lib/vulcan-lib';
import { CommentVotingComponentProps } from '../../lib/voting/votingSystems';
import { Posts } from '../../lib/collections/posts/collection';
import { Revisions } from '../../lib/collections/revisions/collection';
import type { VotingProps } from './withVote';
import { isEAForum } from '../../lib/instanceSettings';
import { useCurrentUser } from '../common/withUser';
import { userCanVote } from '../../lib/collections/users/helpers';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
  },
  agreementSection: {
    display: "inline-block",
    fontSize: 25,
    marginLeft: 10,
    lineHeight: 0.6,
    height: 24,
    minWidth: 60,
    paddingTop: 2,
    outline: theme.palette.border.commentBorder,
    borderRadius: isEAForum ? theme.borderRadius.small : 2,
    textAlign: 'center',
    whiteSpace: "nowrap",
  },
  agreementScore: {
    fontSize: "1.1rem",
    marginLeft: 4,
    lineHeight: 1,
    marginRight: 4,
  },
});

interface TwoAxisVoteOnCommentProps extends CommentVotingComponentProps {
  classes: ClassesType
}

const AgreementVoteAxis = ({ document, hideKarma=false, voteProps, classes }: {
  document: VoteableTypeClient,
  hideKarma?: boolean,
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType,
}) => {
  const { AxisVoteButton, LWTooltip } = Components;
  const collection = getCollection(voteProps.collectionName);
  const voteCount = voteProps.document?.extendedScore?.agreementVoteCount || 0;
  const karma = voteProps.document?.extendedScore?.agreement || 0;
  const currentUser = useCurrentUser();
  const {fail, reason: whyYouCantVote} = userCanVote(currentUser);
  const canVote = !fail;

  let documentTypeName = "comment";
  if (collection == Posts) {
    documentTypeName = "post";
  }
  if (collection == Revisions) {
    documentTypeName = "revision";
  }
  
  const karmaTooltipTitle = hideKarma
    ? 'This post has disabled karma visibility'
    : <div>This {documentTypeName} has {karma} <b>agreement</b> karma ({voteCount} {voteCount === 1 ? "Vote" : "Votes"})</div>

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
    <span className={classes.agreementSection}>
      <TooltipIfEnabled
        title={<div><b>Agreement: Downvote</b><br />How much do you <b>disagree</b> with this, separate from whether you think it's a good comment?<br /><em>For strong downvote, click-and-hold.<br />(Click twice on mobile)</em></div>}
        placement="bottom"
      >
        <AxisVoteButton
          VoteIconComponent={Components.VoteAgreementIcon}
          axis="agreement"
          orientation="left" color="error" upOrDown="Downvote"
          enabled={canVote}
          {...voteProps}
        />
      </TooltipIfEnabled>
      
      <span className={classes.agreementScore}>
        <TooltipIfEnabled title={karmaTooltipTitle} placement="bottom">
          {hideKarma
            ? <span>{' '}</span>
            : <span className={classes.voteScore}>
                {karma}
              </span>
          }
        </TooltipIfEnabled>
      </span>
      
      <TooltipIfEnabled
        title={<div><b>Agreement: Upvote</b><br />How much do you <b>agree</b> with this, separate from whether you think it's a good comment?<br /><em>For strong upvote, click-and-hold<br />(Click twice on mobile)</em></div>}
        placement="bottom"
      >
        <AxisVoteButton
          VoteIconComponent={Components.VoteAgreementIcon}
          axis="agreement"
          orientation="right" color="secondary" upOrDown="Upvote"
          enabled={canVote}
          {...voteProps}
        />
      </TooltipIfEnabled>
    </span>
  </TooltipIfDisabled>
}


const AgreementVoteAxisComponent = registerComponent('AgreementVoteAxis', AgreementVoteAxis, {styles});

declare global {
  interface ComponentTypes {
    AgreementVoteAxis: typeof AgreementVoteAxisComponent
  }
}
