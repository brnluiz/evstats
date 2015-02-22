var fbuserid, fbtoken;
var appid = "432492933490078";
var loggedin = false;
var FB, console;

var EventStats = function () {
  this.genders        = { male: 0, female: 0, other: 0 };
  this.rsvp           = { attending: 0, declined: 0, maybe: 0 };
  this.total          =  0;
  this.totalInvited   =  0;
  this.name          = "";

  this.reset = function () {
    this.genders        = { male: 0, female: 0, other: 0 };
    this.rsvp           = { attending: 0, declined: 0, maybe: 0 };
    this.total          =  0;
    this.totalInvited   =  0;
    this.name           = "";
  }
};

var ChartBox = function (boxId) {
  this.element = document.querySelector(boxId);

  this.hide = function () {
    this.element.loaded = false;
  }
  this.show = function () {
    this.element.loaded = true;
  }
  this.setLoading = function (status) {
    this.element.loading = status;
  }
  this.setName = function (name) {
    this.element.chartName = name;
  }
  this.setTotalSize = function (size) {
    this.element.total = size;
  }
  this.updateChart = function (data) {
    var values = [];
    var objIdx = 0;
    this.setLoading(false);

    Object.keys(data).forEach(function (prop){
      values[objIdx++] = data[prop];
    });

    this.element.values = values;
    console.log(data);
    console.log(this.elements.values);
    this.element.updateChart();
  }
}

var eventStats  = new EventStats();
var chartGender = new ChartBox('stats-box-gender');

window.fbAsyncInit = function() {
  FB.init({
    appId  : appid,
    xfbml  : true,
    cookies: true,
    version: 'v2.2'
  });
  // var element = document.querySelector('facebook-login');
  // console.log(element);
  // element.checkStatus();
};
//
// (function(d, s, id){
//    var js, fjs = d.getElementsByTagName(s)[0];
//    if (d.getElementById(id)) {return;}
//    js = d.createElement(s); js.id = id;
//    js.src = "//connect.facebook.net/en_US/sdk.js";
//    fjs.parentNode.insertBefore(js, fjs);
//  }(document, 'script', 'facebook-jssdk'));

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

  var queryStr = '';
  var attendingIds = [];

  userList.forEach(function (value, index) {
    queryStr = queryStr + ',' + value.id;
    attendingIds[index] = value.id;
  });
  queryStr = queryStr.substring(1);

  FB.api('?ids='+queryStr+'&fields=gender', function (response) {
    console.log(response);
    
    attendingIds.forEach(function (value, index) {

      if (response[value].gender === 'male') {
        eventStats.genders.male++;
      } else if (response[value].gender === 'female') {
        eventStats.genders.female++;
      } else {
        eventStats.genders.other++;
      }
    });
    chartGender.setTotalSize(eventStats.total);
    chartGender.updateChart(eventStats.genders);
  });
}

function getEventStats(eventId) {
  eventStats.reset();
  chartGender.hide();
  chartGender.setLoading(true);

  FB.login(function (response) {
    if (response.authResponse) {

      FB.api('/', 'POST', { batch: [
          { method: 'GET', relative_url: eventId + '/', name: "eventInfo"},
          { method: "GET", relative_url: eventId + '/attending', name: "eventAttending" },
          { method: "GET", relative_url: eventId + '?fields=attending_count,declined_count,maybe_count', name: "eventCounts" },
        ]} ,
        function (response) {
          if (response.error) {
              console.log('[error] Event doesn\'t exists!');
              console.log(response.error);
              chartGender.setLoading(false);
              return false;
          }

          var eventInfo      = JSON.parse(response[0].body);
          var eventUsersList = JSON.parse(response[1].body).data;
          var eventCounts    = JSON.parse(response[2].body);

          eventStats.name = eventInfo.name;
          eventStats.total = eventUsersList.length;

          eventStats.rsvp.attending = eventCounts.attending_count;
          eventStats.rsvp.declined  = eventCounts.declined_count;
          eventStats.rsvp.maybe     = eventCounts.maybe_count;

          eventStats.totalInvited =  eventStats.rsvp.attending;
          eventStats.totalInvited += eventStats.rsvp.declined;
          eventStats.totalInvited += eventStats.rsvp.maybe;

          chartGender.setName(eventStats.name);
          countGender(eventUsersList);
        });
    }
  });
}
