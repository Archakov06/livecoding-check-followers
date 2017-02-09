const app = require('http').createServer(handler)
const io = require('socket.io')(app);
const parseString = require('xml2js').parseString;
const unirest = require('unirest');
const fs = require('fs');

const key = 'VBnCGIUQyUuTKfMN';
const followers = [];

app.listen(process.env.PORT || 8080);

function handler (req, res) {
  fs.readFile(__dirname + '/public/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

function getFollowers(callback, a){
  unirest.get('https://www.liveedu.tv/rss/archakov06/followers/?key=' + key).end(function (response) {
    parseString(response.raw_body, function(err, result){
      callback(result);
    });
  });
}

// Push followers on start in followers array
getFollowers(function(result){
  result.rss.channel[0].item.forEach(function(item){
    if (followers.indexOf(item.title[0]) == -1) followers.push( item.title[0] );
  });
  console.log('Followers: ', followers.length);
});

io.on('connection', function (socket) {

  // Check new followers
  setInterval(function(){

    getFollowers(function(result){
      result.rss.channel[0].item.forEach(function(item){
        if (followers.indexOf(item.title[0]) == -1) {
          followers.push( item.title[0] );
          console.log('New follower: ', item.title[0]);
          socket.emit('new_follower', item.title[0]);
        }
      });
      console.log('Followers: ', followers.length); 
    });

  }, 5000);

});