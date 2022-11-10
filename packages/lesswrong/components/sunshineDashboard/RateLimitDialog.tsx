import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Input from '@material-ui/core/Input';
import React, { useState } from 'react';
import { MODERATOR_ACTION_TYPES, RateLimitType } from '../../lib/collections/moderatorActions/schema';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  daysInput: {
    marginBottom: 8,
    '& input': {
      width: 40,
      textAlign: "center"
    }
  }
});

export const RateLimitDialog = ({ createRateLimit, type, onClose, classes }: {
  createRateLimit: (type: RateLimitType, endDate?: Date) => Promise<void>,
  type: RateLimitType,
  onClose: () => void,
  classes: ClassesType,
}) => {
  const { LWDialog, MetaInfo } = Components;

  const [endAfterDays, setEndAfterDays] = useState<number | undefined>(30);

  const changeEndAfterDays = (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = ev.target.value;
    if (!newValue.length) {
      setEndAfterDays(undefined);
    } else {
      const days = parseInt(ev.target.value);
      setEndAfterDays(days);  
    }
  };

  const applyRateLimit = async () => {
    if (endAfterDays === undefined) {
      await createRateLimit(type);
    } else {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + endAfterDays);
      await createRateLimit(type, endDate);
    }
    onClose();
  };

  return (
    <LWDialog open={true} onClose={onClose}>
      <DialogTitle>
        {MODERATOR_ACTION_TYPES[type]}
      </DialogTitle>
      <DialogContent>
        <div className={classes.daysInput}>
          Expires in
          {" "} 
          <Input
            type='number'
            value={endAfterDays}
            onChange={changeEndAfterDays}
          />
          days.
        </div>
        <div>
          <MetaInfo>
            (Delete the "days" value to set a rate limit with no fixed end date)
          </MetaInfo>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={applyRateLimit}>
          Create Rate Limit
        </Button>
        <Button onClick={onClose}>
          Cancel
        </Button>
      </DialogActions>
    </LWDialog>
  );
}

const RateLimitDialogComponent = registerComponent('RateLimitDialog', RateLimitDialog, {styles});

declare global {
  interface ComponentTypes {
    RateLimitDialog: typeof RateLimitDialogComponent
  }
}

