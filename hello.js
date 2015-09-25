var fs = require('fs');

function getFiles (dir, files_){
    files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files){
        var name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()){
            if(name.indexOf('/dev/fd') >= 0) {
              console.log('skip: ' + name);
              files_.push(name);
            }
            else {
              console.log('dir: ' + name);
              getFiles(name, files_);
            }
        } else {
            files_.push(name);
        }
    }
    return files_;
}

console.log('Listing /dev/*');
console.log(getFiles('/dev'));
