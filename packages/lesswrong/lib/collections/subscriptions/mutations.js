import { Subscriptions } from './collection';
import { subscriptionTypes } from './schema'
import { runCallbacksAsync, newMutation } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';

export const defaultSubscriptionTypeTable = {
  "Posts": subscriptionTypes.newComments,
  "Users": subscriptionTypes.newPosts,
  "Localgroups": subscriptionTypes.newEvents,
}

/**
 * @summary Perform the un/subscription after verification: update the collection item & the user
 * @param {String} action
 * @param {Collection} collection
 * @param {String} itemId
 * @param {Object} user: current user (xxx: legacy, to replace with this.userId)
 * @returns {Boolean}
 */
export const performSubscriptionAction = async (action, collection, itemId, user) => {
  const collectionName = collection.options.collectionName
  const newSubscription = {
    state: action === "subscribe" ? 'subscribed' : 'supressed',
    documentId: itemId,
    collectionName,
    deleted: false,
    type: defaultSubscriptionTypeTable[collectionName]
  }
  newMutation({
    collection: Subscriptions,
    document: newSubscription,
    validate: true,
    currentUser: user,
    context: {
      currentUser: user,
      Users: Users,
    },
  })

  if (action === 'subscribe') {
    await runCallbacksAsync('users.subscribe.async', action, collection, itemId, user);
  } else {
    await runCallbacksAsync('users.unsubscribe.async', action, collection, itemId, user);
  }
};

