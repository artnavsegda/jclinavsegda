var IRZ = require ('irz_module');
import * as config from "config.js";

class Traversable {
  constructor() {
    this.traversable = true;
  }
}

class Executable {
  constructor() {
    this.traversable = false;
  }
}

class Proto extends Traversable {
  constructor(protoname, filelist, filepath) {
    super();
    //this.help = "Help";
    this.help = "";
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
        this.facelist.push(new Option(data, this.basename(filepath), data.actions));
      else
        this.facelist.push(new Face(data, this.basename(filepath)));
    }
  }
  list() {
    var protolist = [];
    this.facelist.forEach((element) => {
      if (element.schema && element.schema.hidden){}
      else
        protolist.push({name: element.name, help: element.help})
    });
    return protolist;
  }
  traverse(command) {
    return this.facelist.find((element) => element.name == command);
  }
}

class Face extends Traversable {
  constructor(schema, name, data) {
    super();
    this.schema = schema;
    this.help = this.schema.description;
    this.name = name;
    if (data) {
      this.data = data;
    } else if (this.schema.acquire) {
      var now_script_path = config.script_path + "/" + this.schema.acquire.exec + " " + this.schema.acquire.args.join(" ");
      //print("piping " + now_script_path);
      var now_data = IRZ.pipe(now_script_path);
      if (now_data)
        this.data = JSON.parse(now_data);
      else
        this.data = {};
    }
    else
    this.data = {};
  }
  list(target) {
    var facelist = [];
    if (this.schema.namesake)
      Object.getOwnPropertyNames(this.data).forEach((element) => facelist.push({name: this.data[element][this.schema.namesake], help: "Help"}));
    else
      Object.getOwnPropertyNames(this.data).forEach((element) => facelist.push({name: element, help: "Help"}));

    if (target == "elements")
      return facelist;

    Object.getOwnPropertyNames(this.schema.actions).forEach((element) => facelist.push({name: element, help: "Help"}));

    return facelist;
  }
  resolve(dataname) {
    if (this.data[dataname]) {
      var schema_section;
      Object.getOwnPropertyNames(this.schema.patternProperties).forEach((pattern) => {
        let re = new RegExp(pattern);
        if (re.test(dataname))
          schema_section = Object.assign({}, this.schema.patternProperties[pattern]);
      });

      if (this.schema.definitions)
        schema_section.definitions = this.schema.definitions;

      return schema_section;
    }
    return undefined
  }
  traverse(command) {
    if (this.schema.namesake) {
      var dataname = Object.getOwnPropertyNames(this.data).find((element) => command == this.data[element][this.schema.namesake])
      if (this.resolve(dataname))
        return new Option(this.resolve(dataname), command, this.schema.patternProperties.actions, this.data[dataname])
    }
    else
      if (this.resolve(command))
        return new Option(this.resolve(command), command, this.schema.patternProperties.actions, this.data[command])

    if (this.schema.actions[command])
      return new Command(this.schema.actions[command], command);

    return undefined;
  }
}

class Option extends Traversable {
  condProcess(cond, values) {
    // return passed condition index
    let i, j, n, c, res
    for(i=0;i<cond.length;i++){
      res = 0
      c = 1
      for(j=0;j<cond[i]["if"].length;j++){
        let keys = Object.keys(cond[i]["if"][j])
        for(n=0;n<keys.length;n++){
          let k = keys[n]
          let v = String(cond[i]["if"][j][k])
          let x
          if(["!"].indexOf( v.substr(0,1)) !== -1){
            x = v.substr(0, 1)
            v = v.substr(1, v.length)
          }

          let o = values[k]?values[k]:''
          switch(x){
            case "!":
              c &= Boolean(String(o) !== String(v))
              break
            default:
              c &= Boolean(String(o) === String(v))
              break
          }
          // console.log('cond:', this.property_name, '|', k, x, v, '][', c)
        }
      }
      res |= c
      // console.log('cond:', this.property_name, '|', Boolean(res))
      if(Boolean(res) === true)
        return i
    }
    return -1
  }
  refProperty(definitions, path) {
    let ref = { "definitions": definitions }
    for(const i in path) {
      if(ref[path[i]] === undefined)
        return {}
      ref = ref[path[i]]
    }
    return ref
  }
  refProcess(ss) {
    if(ss["$ref"] === undefined)
      return
    let ref_str
    let ref
    ref_str = ss["$ref"]
    ref_str = ref_str.split("#")
    // TODO: get definitions from external store ref_str[0]
    ref_str = ref_str[1].split("/").filter((v) => {
      return (v)? true :false
    })
    delete ss["$ref"] //no plz
    ref = this.refProperty(this.schema.definitions, ref_str)
    if(ref !== undefined)
      Object.assign(ss, ref)
  }
  constructor(schema, name, actions, data) {
    super();
    this.schema = schema;
    this.help = this.schema.description;
    this.name = name;
    this.actions = actions;
    if (data) {
      this.data = data;
    } else if (this.schema.acquire) {
      var now_script_path = config.script_path + "/" + this.schema.acquire.exec + " " + this.schema.acquire.args.join(" ");
      var now_data = IRZ.pipe(now_script_path);
      if (now_data)
        this.data = JSON.parse(now_data);
      else
        this.data = {};
    } else
    this.data = {};
  }
  getSchemaElement(elementName) {
    if (this.schema.properties[elementName])
    {
      let ss = Object.assign({}, this.schema.properties[elementName]);
      this.refProcess(ss);

      if(ss["modificator"] !== undefined) {
        let i = this.condProcess(ss["modificator"],this.data)
        if(i !== -1){
          Object.assign(ss, ss["modificator"][i]["then"]);
          this.refProcess(ss);
        }
      }
      return ss;
    }
    return undefined;
  }
  list() {
    var optionlist = [];
    Object.getOwnPropertyNames(this.schema.properties).forEach((element) => {
      if (!this.getSchemaElement(element).hidden)
        optionlist.push({name: element, help: "Help"})
    });
    if (this.actions)
      Object.getOwnPropertyNames(this.actions).forEach((element) => optionlist.push({name: element, help: "Help"}));
    return optionlist;
  }
  traverse(command) {
    if (this.getSchemaElement(command))
    {
      return new Setting(this.getSchemaElement(command), command, this.data, this.schema.set);
    }
    else if (this.actions[command])
      return new Command(this.actions[command], command);
    else
      return undefined;
  }
}

class Command extends Executable {
  constructor(schema, name) {
    super();
    this.schema = schema;
    this.name = name;
  }
  list() {
    return undefined;
  }
  traverse(command) {
    return undefined;
  }
  execute(commandlist) {
    print("executing " + config.script_path + "/" + this.schema.exec + " " + this.schema.args.join(" "));
    if (commandlist.length > 0)
    {
      print("arguments " + commandlist);
    }
    else
    {
      print("no arguments");
    }
  }
}

class Setting extends Executable {
  constructor(schema, name, data, setCommand) {
    super();
    this.schema = schema;
    this.name = name;
    this.data = data;
    this.setCommand = setCommand;
  }
  list(root) {
    if (this.schema.type == "boolean")
    {
      return [{name: "true"}, {name: "false"}];
    }
    // else if (this.schema.enum)
    // {
    //   return this.schema.enum
    // }

    if (this.schema.cue)
    {
      var cuelist = [];
      var cueLocation = root;
      this.schema.cue.forEach((cueelement) => {
        //cuelist.push({name: cueelement});
        var cueSearchPath = cueelement.split("/");
        var pathelement;
        for (pathelement of cueSearchPath){
          if (pathelement) {
            //print("A:" + pathelement);
            cueLocation.traverse(pathelement);
            if (cueLocation.traverse(pathelement))
              cueLocation = cueLocation.traverse(pathelement);
            else {
              break;
            }
          }
        }
        cuelist.push(...cueLocation.list("elements"))
      });
      return cuelist;
    }

    return undefined;
  }
  traverse(command) {
    //this.data = command;
    return undefined;
  }
  execute(commandlist) {
    print("Extracted schema: " + JSON.stringify(this.schema));
    print("Extracted data: " + JSON.stringify(this.data));
    //print(this.list());

    if (commandlist.length > 0)
    {
      print("inserting " + commandlist);
      this.data[this.name] = commandlist[0];
      print(this.data[this.name]);

      if (this.setCommand)
      {
        print("Script setter: " + JSON.stringify(this.setCommand));
        var commandstring = config.script_path + "/" + this.setCommand.exec + " " + this.setCommand.args.join(" ");
        print("executing " + commandstring);
        IRZ.pipe(commandstring, "hello");
        // {_section: 'cfg01241', _option: 'ipaddr', _value: '1.1.1.1'}
      }

    }
    else
    {
      print("displaying");
      print(this.data[this.name]);
    }
  }
}

export { Proto, Face, Option, Setting, Command };
