# GitHub droid

The GitHub droid allows managing GitHub organizations directly from Slack.

Currently in development, it only allows you to assign a user to a Pull Request.

## Install with Gynoid

You will need a new Slack bot token to start your bot. Then, use [Gynoid](https://github.com/auth0/gynoid) to start the bots framework.

To install with Gynoid:

```
register gitbot using {slack-token}
```

This will start your bot in Slack. Now, extend its functionality by running this command:

```
extend gitbot from verlic/github-droid
```

Done!

## Using Gitbot

Invite your bot to a channel. Then you can mention the bot to execute commands.

> **Note:** default organization is Auth0. Set a the key ORGANIZATION for this bot in order to change it.

### Assign a PR

Use this command to assign a user to a PR:

```
@gitbot assign {repo}#{pr-number} to {github-user}
```
