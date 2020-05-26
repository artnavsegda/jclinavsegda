
class Proto {
  constructor(protoname, filelist, filepath) {
    this.facelist = [];
    this.name = protoname;
    if (filelist)
      this.load(filepath, filelist)
  }
  add(newelement) {
    this.facelist.push(newelement);
  }
  basename(filename)
  {
    var path = filename.split('/');
    var basename = path[path.length-1].split('.')
    return basename[0];
  }
  load(filepath, filelist) {
    if (filelist) {
      this.facelist = [];
      filelist.forEach((filename) => {
        var path = filename.split('/');
        var attachproto = this;
        path.forEach((item, i) => {
          if (i > 0) {
            if (i == path.length-1)
              attachproto.load(filepath + filename);
            else {
              var attachmaybe = attachproto.traverse(item);
              if (!attachmaybe)
              {
                attachmaybe = new Proto(item);
                attachproto.facelist.push(attachmaybe);
              }
              attachproto = attachmaybe;
            }
          }
        });
      });
    } else {
      var data = JSON.parse(IRZ.cat(filepath))
      if (data.properties)
        this.facelist.push(new Option(data, this.basename(filepath)));
      else
        this.facelist.push(new Face(data, this.basename(filepath)));
    }
  }
  list() {
    var protolist = [];
    this.facelist.forEach((element) => protolist.push(element.name));
    return protolist;
  }
  traverse(command) {
    return this.facelist.find((element) => element.name == command);
  }
}

class Face {
  constructor(schema, name, data) {
    this.schema = schema;
    this.name = name;
    if (data) {
      this.data = data;
    } else if (this.schema.acquire) {
      var now_script_path = config.script_path + "/" + this.schema.acquire.exec + " " + this.schema.acquire.args.join(" ");
      //print("piping " + now_script_path);
      var now_data = IRZ.pipe(now_script_path);
      if (now_data)
        this.data = JSON.parse(now_data);
    }
  }
  list() {
    if (this.schema.namesake) {
      var facelist = [];
      Object.getOwnPropertyNames(this.data).forEach((element) => facelist.push(this.data[element][this.schema.namesake]));
      return facelist;
    }
    else
      return Object.getOwnPropertyNames(this.data);
  }
  resolve(dataname) {
    if (this.data[dataname]) {
      //print("data: " + JSON.stringify(this.data[command]));
      var schema_section;
      Object.getOwnPropertyNames(this.schema.patternProperties).forEach((pattern) => {
        let re = new RegExp(pattern);
        if (re.test(dataname))
          schema_section = this.schema.patternProperties[pattern];
      });
      //print("schema: " + JSON.stringify(schema_section));
      return schema_section;
    }
    return undefined
  }
  traverse(command) {
    if (this.schema.namesake) {
      var dataname = Object.getOwnPropertyNames(this.data).find((element) => command == this.data[element][this.schema.namesake])
      if (this.resolve(dataname))
        return new Option(this.resolve(dataname), command, this.data[dataname])
    }
    else
      if (this.resolve(command))
        return new Option(this.resolve(command), command, this.data[command])
    return undefined;
  }
}

class Option {
  constructor(schema, name, data) {
    this.schema = schema;
    this.name = name;
    if (data) {
      this.data = data;
    } else if (this.schema.acquire) {
      var now_script_path = config.script_path + "/" + this.schema.acquire.exec + " " + this.schema.acquire.args.join(" ");
      //print("piping " + now_script_path);
      var now_data = IRZ.pipe(now_script_path);
      if (now_data)
        this.data = JSON.parse(now_data);
    }
  }
  list() {
    return Object.getOwnPropertyNames(this.schema.properties);
  }
  traverse(command) {
    //print("schema: " + JSON.stringify(this.schema.properties[command]));
    //print("data: " + this.data[command]);
    //print(this.data[command]);
    return undefined;
  }
}

export { Proto, Face, Option };
