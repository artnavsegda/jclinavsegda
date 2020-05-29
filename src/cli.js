var IRZ = require ('irz_module');
import * as config from "config.js";
import * as utils from "jsoned.js";

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
      var data = utils.json_clean(IRZ.cat(filepath))
      if(data) {
        if (data.properties)
          this.facelist.push(new Option(data, this.basename(filepath), data.actions));
        else
          this.facelist.push(new Face(data, this.basename(filepath)));
      }
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
  acquire() {
    if (this.schema.acquire) {
      var now_script_path = config.script_path + "/" + this.schema.acquire.exec + " " + this.schema.acquire.args.join(" ");
      // print("acquiring " + now_script_path);
      var now_data = IRZ.pipe(now_script_path);
      if (now_data)
        this.data = JSON.parse(now_data);
      else
        this.data = {};
    } else {
      this.data = {};
    }
  }
  constructor(schema, name, data) {
    super();
    this.schema = schema;
    this.help = this.schema.description;
    this.name = name;
    if (data) {
      this.data = data;
    } else
      this.acquire();
  }
  list(target) {
    var facelist = [];
    if (this.schema.namesake)
      Object.getOwnPropertyNames(this.data).forEach((element) => facelist.push({name: this.data[element][this.schema.namesake], help: this.help}));
    else
      Object.getOwnPropertyNames(this.data).forEach((element) => facelist.push({name: element, help: this.help}));

    if (target == "elements")
      return facelist;

    if(this.schema.actions) // check
      Object.getOwnPropertyNames(this.schema.actions).forEach((element) => facelist.push({name: element, help: this.schema.actions[element].description}));

    return facelist;
  }
  resolve(dataname) {
    if (this.data[dataname]) {
      var schema_section;
      Object.getOwnPropertyNames(this.schema.patternProperties).forEach((pattern) => {
        let re = new RegExp(pattern);
        if (re.test(dataname))
          schema_section = this.schema.patternProperties[pattern];
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
        return new Option(this.resolve(dataname), command, this.schema.patternProperties.actions, this.data[dataname], this, dataname)
    }
    else
      if (this.resolve(command))
        return new Option(this.resolve(command), command, this.schema.patternProperties.actions, this.data[command], this)

    if(this.schema.actions) // check
      if (this.schema.actions[command])
        return new Command(this.schema.actions[command], command, this);

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
    ref = this.refProperty(this.definitions, ref_str)
    if(ref !== undefined)
      Object.assign(ss, ref)
  }
  acquire(){
    print("staring acquire");
    if (this.schema.acquire) {
      var now_script_path = config.script_path + "/" + this.schema.acquire.exec + " " + this.schema.acquire.args.join(" ");
      print("acquring " + now_script_path);
      var now_data = IRZ.pipe(now_script_path);
      if (now_data)
        this.data = JSON.parse(now_data);
      else
        this.data = {};
    } else
    this.data = {};
  }
  constructor(schema, name, actions, data, parent, section) {
    super();
    this.section = section;
    this.schema = schema;
    this.parent = parent;
    if (parent)
    {
      if (parent.definitions)
        this.definitions = parent.definitions;
      else
        this.definitions = this.schema.definitions;
      if (parent.setCommand)
        this.setCommand = parent.schema.set;
      else if (this.schema.set) {
        this.setCommand = this.schema.set;
      }
    } else {
      print("no setcommand in constructor");
    }
    this.help = this.schema.description;
    this.name = name;
    this.actions = actions;
    if (data) {
      this.data = data;
    } else
      this.acquire();
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
        optionlist.push({name: element, help: this.schema.properties[element].description})
    });

    if (this.actions) {
      Object.getOwnPropertyNames(this.actions).forEach((element) => optionlist.push({name: element, help: this.actions[element].description}));
    }

    return optionlist;
  }

  traverse(command) {
    if (this.getSchemaElement(command))
      return new Setting(this.getSchemaElement(command), command, this.data, this.setCommand, this.section);
    else if (this.actions && this.actions[command]) // check
    {
      if (this.parent){
        return new Command(this.actions[command], command, this.parent, this.section);
      } else {
        return new Command(this.actions[command], command, this, this.section);
      }
    }
    else
      return undefined;
  }
}

class Command extends Executable {
  constructor(schema, name, parent, section) {
    super();
    this.schema = schema;
    this.name = name;
    this.parent = parent;
    this.section = section;
  }
  list() {
    return undefined;
  }
  traverse(command) {
    return undefined;
  }
  execute(commandlist) {
    var commandstring = config.script_path + "/" + this.schema.exec + " " + this.schema.args.join(" ");

    if (this.section)
    {
      commandstring = "_VALUES='"+ JSON.stringify({section: this.section}) +"';" + commandstring;
    }

    print("executing " + commandstring);
    if (commandlist.length > 0)
    {
      print("arguments " + commandlist);
    }
    else
    {
      print("no arguments");
    }
    //do something
    if(this.schema.merge){
      //do pipe & data re-evaluation
      var output = IRZ.pipe(commandstring);
      if (output) {
       this.parent.data = JSON.parse(data);
       return true;
      }
    } else {
      IRZ.system(commandstring);
    }
    //end do something
    if(this.schema.reload)
    {
      print("reloading data");
      this.parent.acquire();
      return true;
    }
    else
      return false;
  }
}

class Setting extends Executable {
  constructor(schema, name, data, setCommand, section) {
    super();
    this.schema = schema;
    this.name = name;
    this.data = data;
    this.setCommand = setCommand;
    this.section = section;
  }

  list(root) {
    // must return [{name: "name"}] !!!

    if (this.schema.type == "boolean")
    {
      return [{name: "true"}, {name: "false"}];
    }

    if (this.schema.cue)
    {
      var cuelist = [];
      var cueLocation = root;
      this.schema.cue.forEach((cueelement) => {
        //cuelist.push({name: cueelement});
        var cueSearchPath = cueelement.split("/").filter((c) => {return c});
        var pathelement;
        for (pathelement of cueSearchPath){
          cueLocation.traverse(pathelement);
          if (cueLocation.traverse(pathelement))
            cueLocation = cueLocation.traverse(pathelement);
          else {
            break;
          }
        }
        cuelist.push(...cueLocation.list("elements"))
      });
      return cuelist
    }

    if (this.schema.enum) {
      return this.schema.enum.map((element) => { return {name: element} })
    }

    if(this.schema.items.enum)
      return this.schema.items.enum.map((element) => { return {name: element} })

    return undefined;
  }

  traverse(command) {
    //this.data = command;
    return undefined;
  }

  execute(commandlist) {
    // print("Extracted schema: " + JSON.stringify(this.schema));
    // print("Extracted data: " + JSON.stringify(this.data));

    commandlist = commandlist.filter((e)=>{
      return e && e !== undefined
    })

    if (commandlist.length === 0) {
      // print("displaying");
      if(this.data[this.name] !== undefined)
        if(this.schema.type == "array")
          this.data[this.name].map((e)=>{
            print(e)
          })
        else
          print(this.data[this.name]);
      return
    }

    if(this.schema.readOnly === true)
      return

    // print("inserting " + commandlist);

    var value

    if(this.schema.type == "array") {
      value = []
      if(this.data[this.name] !== undefined)
        value = [...this.data[this.name]]

      commandlist.map((e)=>{
        if(e.substr(0, 1) == '-') {
          e = e.substr(1, e.length)

          if(e === "")
            return

          for(;;){ // delete all matches
            var p = value.indexOf(e)
            if (p == -1)
              break
            value.splice(p, 1)
          }

        } else {
          if(this.schema.uniqueItems === true)
            if(value.indexOf(e) !== -1)
              return

          if(this.schema.items.enum)
            if(this.schema.items.enum.indexOf(e) === -1)
              return

          value.push(e)
        }

      })

    } else {
      value = commandlist.join(" ");
      if(value.substr(0, 1) == "-")
        value = undefined

      else {
        if(this.schema.type == "boolean")
          value = ["0", "", "false", false].indexOf(value) === -1

        else if(this.schema.type == "number" || this.schema.type == "integer" ) {
          if(isNaN(Number(value))) {
            print("value must be number")
            return
          }
          value = Number(value)
        }
      }
    }

    if (this.setCommand) {
      print("Script setter: " + JSON.stringify(this.setCommand));
      var commandstring = config.script_path + "/" + this.setCommand.exec + " " + this.setCommand.args.join(" ");
      print("executing " + commandstring);

      if (this.section)
        var exit_code = IRZ.pipe(commandstring, JSON.stringify({_section: this.section, _option: this.name, _value: value}));
      else {
        var exit_code = IRZ.pipe(commandstring, JSON.stringify({_option: this.name, _value: value}));
      }
      // {_section: 'cfg01241', _option: 'ipaddr', _value: '1.1.1.1'}
    }

    if(exit_code === 0)
      this.data[this.name] = value;
  }
}

export { Proto, Face, Option, Setting, Command };
