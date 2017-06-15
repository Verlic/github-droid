var moment = require('moment');
var GitHubApi = require('github'),
  promise = require('promise'),
  github = new GitHubApi({
    // required
    version: "3.0.0",
    // optional
    debug: false,
    protocol: "https",
    host: "api.github.com",
    pathPrefix: "",
    timeout: 5000,
    headers: {
      "user-agent": "auth0-pr-assigner"
    }
  }),

  editIssue = promise.denodeify(github.issues.edit);

module.exports = function (context) {
  var token = context.config.GITHUB_TOKEN;
  var organization = context.config.ORGANIZATION || 'auth0';

  // Authenticate with GitHub
  github.authenticate({
    type: 'oauth',
    token: token
  });

  return {
    assignPr: function (req, res) {
      var repo = req.params.repo;
      var pr = req.params.pr;
      var user = req.params.user;

      var payload = {
        number: pr,
        user: organization,
        repo: repo,
        assignee: user
      };

      editIssue(payload)
        .then(function () {
          return res.text(`_User ${user} assigned to ${repo}#${pr}_`).send();
        }).catch(function (err) {
          return res.text('Unable to assign user to Pull Request.\n```' + JSON.stringify(err, null, 2) + '```').send();
        });
    },
    merged: function (req, res) {
      var repo = req.params.repo;
      var relative = req.params.relative.toLowerCase();
      relative = relative === 'today' || relative === 'yesterday' ? 'day' : relative;
      var relativeDate = moment().utc().subtract(1, relative).format('YYYY-MM-DD');
      var payload = {
        q: `is:merged merged:>=${relativeDate} repo:${organization}/${repo}`
      };

      var prs = [];
      function outputPrs() {
        var attachment = {
          title: `Merged PRs for ${repo} - 1 ${relative}`,
          fallback: `Merged PRs for ${repo}`,
          'mrkdwn_i': ['fields'],
          color: '#36a64f',
          fields: []
        };

        prs.forEach(function (pr) {
          attachment.fields.push({ value: `<${pr.html_url}|${pr.title}>`, short: false });
        });

        if (prs.length === 0) {
          attachment.text = 'No PRs merged found';
        }

        return res.attachment(attachment).send();
      }

      function getPrs(err, response) {
        if (err) {
          return res.text('Unable to retrieve the merged PRs\n```' + JSON.stringify(err) + '```').send();
        }

        prs = prs.concat(response.data.items);
        if (github.hasNextPage(response)) {
          github.getNextPage(response, getPrs);
        } else {
          outputPrs();
        }
      }

      github.search.issues(payload, getPrs);
    },
    isProtected: function (req, res) {
      var payload = {
        owner: organization,
        repo: req.params.repo,
        branch: req.params.branch
      };

      github.repos.getBranchProtection(payload)
        .then((result) => {
          return res.text('```' + JSON.stringify(result.data, null, 2) + '```').send();
        })
        .catch((e) => {
          if (e.message) {
            return res.text(':warning: ' + JSON.parse(e.message).message).send();
          }

          return res.text('An error has occurred.').send();
        });
    },
    help: function help(req, res) {
      var metadata = require('./droid.json');

      var actionsWithDescription = metadata.actions.filter((action) => {
        return action.help;
      }).map((action) => action.help);

      if (actionsWithDescription.length === 0) {
        return res.text('No help available').send();
      }

      console.log(actionsWithDescription);
      return res.text('Help:\n- ' + actionsWithDescription.join('\n- ')).send();
    }
  };
};
