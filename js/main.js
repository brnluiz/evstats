var fbuserid, fbtoken;
var appid = "432492933490078";
var loggedin = false;
var FB, console;

var eventStats = {
  genders: {
    male: 0, female: 0, other: 0
  },
  total: 0
};

FB.init({
  appId  : appid,
  status : true,
  cookie : true,
  xfbml  : true
});

function logoutFB() {
  "use strict";
  FB.logout(function (response) {
      // user is now logged out
  });
}

function getUrlPathInfo(url, initialParent) {
  var parser = document.createElement('a');
  var info = '';

  parser.href = url;
  info = parser.pathname.replace(initialParent, '');
  info = info.substr(1);
  info = info.split(/[/]/);

  return info;
}

function countGender(userList) {
  "use strict";

  var queryStr = '';
  var attendingIds = [];

  userList.forEach(function (value, index) {
    queryStr = queryStr + ',' + value.id;
    attendingIds[index] = value.id;
  });

  queryStr = queryStr.substring(1);

  FB.api('?ids='+queryStr+'&fields=gender', function (response) {
    attendingIds.forEach(function (value, index) {
      var gender = response[value].gender;

      if (gender === 'male') {
        eventStats.genders.male++;
      } else if (gender === 'female') {
        eventStats.genders.female++;
      } else {
        eventStats.genders.other++;
      }
    });

    updateChart(eventStats);
  });
}

function getEventStats(eventId) {
  "use strict";

  FB.login(function (response) {
    if (response.authResponse) {

      FB.api(eventId + '/attending', function (response) {
          if (response.error) {
              console.log('[error] Event doesn\'t exists!');
              console.log(response.error);
              return false;
          }

          eventStats.total = response.data.length;
          countGender(response.data);
      });
    } else {
      console.log('User cancelled login or did not fully authorize.');
    }
  });
}

function updateChart() {
  var chart = document.querySelector('stats-box-gender');
  chart.updateChart(eventStats.genders);

  // Reset eventStats
  eventStats = {
    genders: {
      male: 0, female: 0, other: 0
    },
    total: 0
  };
}
