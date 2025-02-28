import { initializeSetting } from './publicSettings'
import { isServer, isDevelopment, isAnyTest, getInstanceSettings, getAbsoluteUrl } from './executionEnvironment';
import { pluralize } from './vulcan-lib/pluralize';
import startCase from 'lodash/startCase' // AKA: capitalize, titleCase

const getNestedProperty = function (obj, desc) {
  var arr = desc.split('.');
  while(arr.length && (obj = obj[arr.shift()]));
  return obj;
};

// Is any one of the arguments an object
const anyIsObject = (...args: any[]): boolean => {
  return args.some(a => typeof a === 'object' && !Array.isArray(a) && a !== null)
}

export const Settings: Record<string,any> = {};

const getSetting = <T>(settingName: string, settingDefault?: T): T => {

  let setting;
  const instanceSettings = getInstanceSettings();

  // if a default value has been registered using registerSetting, use it
  if (typeof settingDefault === 'undefined' && Settings[settingName])
    settingDefault = Settings[settingName].defaultValue;

  if (isServer) {
    // look in public, private, and root
    const rootSetting = getNestedProperty(instanceSettings, settingName);
    const privateSetting = instanceSettings.private && getNestedProperty(instanceSettings.private, settingName);
    const publicSetting = instanceSettings.public && getNestedProperty(instanceSettings.public, settingName);
    
    // if setting is an object, "collect" properties from all three places
    if (anyIsObject(rootSetting, privateSetting, publicSetting)) {
      setting = {
        ...settingDefault,
        ...rootSetting,
        ...privateSetting,
        ...publicSetting,
      };
    } else {
      if (typeof rootSetting !== 'undefined') {
        setting = rootSetting;
      } else if (typeof privateSetting !== 'undefined') {
        setting = privateSetting;
      } else if (typeof publicSetting !== 'undefined') {
        setting = publicSetting;
      } else {
        setting = settingDefault;
      }
    }

  } else {
    // look only in public
    const publicSetting = instanceSettings.public && getNestedProperty(instanceSettings.public, settingName);
    setting = typeof publicSetting !== 'undefined' ? publicSetting : settingDefault;
  }

  // Settings[settingName] = {...Settings[settingName], settingValue: setting};

  return setting;

};

/* 
  A setting which is configured via Meteor's configuration system, ie in `settings.json`, as opposed to a database setting.

  For documentation on database settings, see `databaseSettings.ts`
  
  arguments: 
    settingName: JSON path to the setting in the settings.json file
    defaultValue: What value <Setting>.get() returns when no value is found in the JSON file
    settingType: 
      "warning": Logs a console warning when no value is provided in the settings.json path
      "required": Throws an error when no value is provided in the settings.json path
      "optional": No warnings or errors are logged when no value is provided in the specified settings.json path

  Method: 
    get: Returns the current value of the setting
*/
export class PublicInstanceSetting<SettingValueType> {
  constructor(
    private settingName: string, 
    private defaultValue: SettingValueType,
    private settingType: "optional" | "warning" | "required"
  ) {
    initializeSetting(settingName, "instance")
    if (isDevelopment && settingType !== "optional") {
      const settingValue = getSetting(settingName)
      if (typeof settingValue === 'undefined') {
        if (settingType === "warning") {
          if (!isAnyTest) {
            // eslint-disable-next-line no-console
            console.log(`No setting value provided for public instance setting for setting with name ${settingName} despite it being marked as warning`)
          }
        }
        if (settingType === "required") {
          throw Error(`No setting value provided for public instance setting for setting with name ${settingName} despite it being marked as required`)
        } 
      }
    }
  }
  get(): SettingValueType {
    return getSetting(this.settingName, this.defaultValue)
  }
}

/*
  Public Instance Settings
*/

export type ForumTypeString = "LessWrong"|"AlignmentForum"|"EAForum";
export const allForumTypes: Array<ForumTypeString> = ["LessWrong","AlignmentForum","EAForum"];
export const forumTypeSetting = new PublicInstanceSetting<ForumTypeString>('forumType', 'LessWrong', 'warning') // What type of Forum is being run, {LessWrong, AlignmentForum, EAForum}

export const isLW = forumTypeSetting.get() === "LessWrong"
export const isEAForum = forumTypeSetting.get() === "EAForum"
export const isAF = forumTypeSetting.get() === "AlignmentForum"

export const forumTitleSetting = new PublicInstanceSetting<string>('title', 'LessWrong', 'warning') // Default title for URLs

// Your site name may be referred to as "The Alignment Forum" or simply "LessWrong". Use this setting to prevent something like "view on Alignment Forum". Leave the article uncapitalized ("the Alignment Forum") and capitalize if necessary.
export const siteNameWithArticleSetting = new PublicInstanceSetting<string>('siteNameWithArticle', "LessWrong", "warning")

/**
 * By default, we switch between using Mongo or Postgres based on the forum type. This can make it difficult to
 * test changes with different forum types to find regressions. Setting this to either "mongo" or "pg" will force
 * all collections to be of that type whatever the forum type setting might be, making cross-forum testing much
 * easier.
 */
export const forceCollectionTypeSetting = new PublicInstanceSetting<CollectionType|null>("forceCollectionType", null, "optional");

/**
 * Name of the tagging feature on your site. The EA Forum is going to try
 * calling them topics. You should set this setting with the lowercase singular
 * form of the name. We assume this is a single word currently. Spaces will
 * cause issues.
 */
export const taggingNameSetting = new PublicInstanceSetting<string>('taggingName', 'tag', 'optional')
export const taggingNameCapitalSetting = {get: () => startCase(taggingNameSetting.get())}
export const taggingNamePluralSetting = {get: () => pluralize(taggingNameSetting.get())}
export const taggingNamePluralCapitalSetting = {get: () => pluralize(startCase(taggingNameSetting.get()))}
export const taggingNameIsSet = {get: () => taggingNameSetting.get() !== 'tag'}

// NB: Now that neither LW nor the EAForum use this setting, it's a matter of
// time before it falls out of date. Nevertheless, I expect any newly-created
// forums to use this setting.
export const hasEventsSetting = new PublicInstanceSetting<boolean>('hasEvents', true, 'optional') // Whether the current connected server has events activated

// Sentry settings
export const sentryUrlSetting = new PublicInstanceSetting<string|null>('sentry.url', null, "warning"); // DSN URL
export const sentryEnvironmentSetting = new PublicInstanceSetting<string|null>('sentry.environment', null, "warning"); // Environment, i.e. "development"
export const sentryReleaseSetting = new PublicInstanceSetting<string|null>('sentry.release', null, "warning") // Current release, i.e. hash of lattest commit
export const siteUrlSetting = new PublicInstanceSetting<string>('siteUrl', getAbsoluteUrl(), "optional")

// FM Crossposting
export const fmCrosspostSiteNameSetting = new PublicInstanceSetting<string|null>("fmCrosspost.siteName", null, "optional");
export const fmCrosspostBaseUrlSetting = new PublicInstanceSetting<string|null>("fmCrosspost.baseUrl", null, "optional");

// For development, there's a matched set of CkEditor settings as instance
// settings, which take precedence over the database settings. This allows
// using custom CkEditor settings that don't match what's in the attached
// database.
export const ckEditorUploadUrlOverrideSetting = new PublicInstanceSetting<string | null>('ckEditorOverride.uploadUrl', null, "optional") // Image Upload URL for CKEditor
export const ckEditorWebsocketUrlOverrideSetting = new PublicInstanceSetting<string | null>('ckEditorOverride.webSocketUrl', null, "optional") // Websocket URL for CKEditor (for collaboration)

// Stripe setting

//Test vs Production Setting
export const testServerSetting = new PublicInstanceSetting<boolean>("testServer", false, "warning")

export const disableEnsureIndexSetting = new PublicInstanceSetting<boolean>("disableEnsureIndex", false, "optional");

/** Currently LW-only; forum-gated in `userCanVote` */
export const lowKarmaUserVotingCutoffDateSetting = new PublicInstanceSetting<string>("lowKarmaUserVotingCutoffDate", "11-30-2022", "optional");
/** Currently LW-only; forum-gated in `userCanVote` */
export const lowKarmaUserVotingCutoffKarmaSetting = new PublicInstanceSetting<number>("lowKarmaUserVotingCutoffKarma", 1, "optional");
