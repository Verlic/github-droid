var GitHubApi = require('github'),
  promise = require('promise'),
  github = new GitHubApi({
    // required
    version: "3.0.0",
    // optional
    debug: true,
    protocol: "https",
    host: "api.github.com",
    pathPrefix: "",
    timeout: 5000,
    headers: {
      "user-agent": "auth0-pr-assigner"
    }
  }),

  editIssue = promise.denodeify(github.issues.edit);

module.exports = function(context) {
  var token = context.config.GITHUB_TOKEN;
  var organization = context.config.ORGANIZATION || 'auth0';

  // Authenticate with GitHub
  github.authenticate({
    type: 'oauth',
    token: token
  });

  return {
    assignPr: function(req, res) {
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
        .then(function() {
          return res.text(`_User ${user} assigned to ${repo}#${pr}_`).send();
        }).catch(function(err) {
          return res.text('Unable to assign user to Pull Request.\n```' + JSON.stringify(err, null, 2) + '```').send();
        });
    },
    help: function(req, res) {
      return res.text('Use `assign {repo}#{pr-number} to {github-user}` to assign a user to a Pull Request').send();
    }
  };
};
