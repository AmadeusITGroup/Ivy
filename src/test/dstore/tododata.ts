import * as data from "../../dstore/dstore";

// Todo MVC sample - client-side only
`
// data structure of the todo mvc application
<#TodoApp xmlns="$dstore">
   <newEntry @string/>
   <list @list([])>
       <#Todo>
           <description @string/> // @debug -> call debugger when this is changed !!!!
           <complete @boolean/> // @trace -> trace write in console @trace({output}) -> trace in output object
           <editing @boolean/>
       </>
   </list>
   <itemsLeft @number(0) @depends("/list")/> 
   <filter @enum("ALL, ACTIVE, COMPLETED") /> // default = "ALL"
   <listView @list @depends("/filter", "/list")>
       <@type({Todo})/>
   </listView>
</>
`

// the following code should be generated by the dstore code generator

export let Todo: data.DataNodeCfg<TodoData> = new data.DataNodeCfgImpl<TodoData>(function () { return new TodoImpl(); })

export interface TodoData {
    description: string;
    complete: boolean;
    editing: boolean;
}

class TodoImpl extends data.DataSet implements TodoData {
    $_description = ""; // current value
    $__description = ""; // old value (must be identical to current default values)
    $_complete = false;
    $__complete = false;
    $_editing = false;
    $__editing = false;

    constructor(initDmd = true) { super(Todo as any, initDmd); }

    get description() { return this.$_description; }
    set description(v) { data.setProp(this, "description", v); }

    get complete() { return this.$_complete; }
    set complete(v) { data.setProp(this, "complete", v); }

    get editing() { return this.$_editing; }
    set editing(v) { data.setProp(this, "editing", v); }

    $createNewVersion() {
        let ds = new TodoImpl(false);
        data.transferDmd(this, ds);
        this.$next = ds;

        ds.$_description = ds.$__description = this.$_description;
        this.$_description = this.$__description;
        this.$__description = ""; // set empty as will not be used any more (this will be sealed)

        ds.$_complete = ds.$__complete = this.$_complete;
        this.$_complete = this.$__complete;

        ds.$_editing = ds.$__editing = this.$_editing;
        this.$_editing = this.$__editing;
    }
}

export let TodoApp: data.DataNodeCfg<TodoAppData> = new data.DataNodeCfgImpl<TodoAppData>(
    function () { return new TodoAppImpl(); },
    function (nd: TodoAppData) {
        // getDependencies
        let res: any[][] = []; // res: (data.DataNode | string | null)[][] = [];
        res.push(["/itemsLeft", "itemsLeft", nd.list]);
        res.push(["/listView", "listView", "filter", nd.list]);
        return res;
    }
)

export interface TodoAppData {
    newEntry: string;
    itemsLeft: number;
    filter: string;
    list: data.DataList<TodoData>;
    listView: data.DataList<TodoData>;
}

class TodoListImpl extends data.DataListImpl<TodoImpl> {
    constructor(initDmd = true) {
        super(Todo as any, initDmd);
    }
    $newInstance(initDmd: boolean): data.DataListImpl<TodoImpl> {
        return new TodoListImpl(initDmd);
    }
    $newItem(): TodoImpl {
        return new TodoImpl();
    }
}

const TodoAppFilterEnum = ["ALL", "ACTIVE", "COMPLETED"];

class TodoAppImpl extends data.DataSet implements TodoAppData {
    $_newEntry = "";
    $__newEntry = "";
    $_itemsLeft = 0;
    $__itemsLeft = 0;
    $_filter = "ALL";
    $__filter = "ALL";
    $_list: TodoListImpl;
    $__list: TodoListImpl | null = null;
    $_listView: TodoListImpl;
    $__listView: TodoListImpl | null = null;

    constructor(initDmd = true) {
        super(TodoApp as any, initDmd);
        if (initDmd) {
            this.list = new TodoListImpl();
        }
    }

    get newEntry() { return this.$_newEntry; }
    set newEntry(v) { data.setProp(this, "newEntry", v); }

    get itemsLeft() { return this.$_itemsLeft; }
    set itemsLeft(v) { data.setProp(this, "itemsLeft", v); }

    get filter() { return this.$_filter; }
    set filter(v) { if (TodoAppFilterEnum.indexOf(v) > -1) data.setProp(this, "filter", v); }

    get list() { return this.$_list; }
    set list(v) { if (v) data.setProp(this, "list", v, true); }

    get listView() { return this.$_listView; }
    set listView(v) { if (v) data.setProp(this, "listView", v, true); }

    $createNewVersion() {
        let ds = new TodoAppImpl(false);
        data.transferDmd(this, ds);
        this.$next = ds;

        ds.$_newEntry = ds.$__newEntry = this.$_newEntry;
        this.$_newEntry = this.$__newEntry;
        this.$__newEntry = ""; // set empty as will not be used any more (this will be sealed)

        ds.$_itemsLeft = ds.$__itemsLeft = this.$_itemsLeft;
        this.$_itemsLeft = this.$__itemsLeft;

        ds.$_filter = ds.$__filter = this.$_filter;
        this.$_filter = this.$__filter;
        this.$__filter = "";

        ds.$_list = ds.$__list = (data.setNewVersionRef(this.$_list, this, ds) as TodoListImpl);
        this.$_list = this.$__list!;
        this.$__list = null;

        ds.$_listView = ds.$__listView = (data.setNewVersionRef(this.$_listView, this, ds) as TodoListImpl);
        this.$_listView = this.$__listView!;
        this.$__listView = null;
    }
}