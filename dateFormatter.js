//jshint esversion:6

//formats date in this format "%Y-%m-%dT%H:%M:%S.%LZ"

module.exports = dateFormatter;

function dateFormatter(today) {
  var date =
    today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
  var time =
    ("0" + today.getHours()).slice(-2) +
    ":" +
    ("0" + today.getMinutes()).slice(-2);
  return (currentDateTime = date + "T" + time);
}
