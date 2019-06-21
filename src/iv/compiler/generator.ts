import { XjsTplFunction, XjsContentNode, XjsExpression, XjsElement, XjsParam, XjsNumber, XjsBoolean, XjsString, XjsProperty, XjsFragment, XjsJsStatements, XjsJsBlock, XjsComponent, XjsEvtListener, XjsParamNode, XjsNode, XjsTplArgument, XjsText, XjsDecorator } from '../../xjs/parser/types';
import { parse } from '../../xjs/parser/xjs-parser';
import { getPropertyDefinition, getClassDecorator } from '../../trax/trax/compiler/generator';

export interface CompilationOptions {
    body?: boolean;                     // if true, will output the template function body in the result
    statics?: boolean;                  // if true, the statics array will be in the result
    function?: boolean;                 // if true the js function will be in the result
    imports?: boolean;                  // if true the imports will be added as comment to the js function
    importMap?: { [key: string]: 1 };   // imports as a map to re-use the map from a previous compilation
    filePath?: string;                  // file name - used for error reporting
    lineOffset?: number;                // shift error line count to report the line number of the file instead of the template
}

export interface CompilationResult {
    body?: string;                      // template function body
    statics?: any[];                    // statics outside function body
    function?: string;                  // full result function as a string
    importMap?: { [key: string]: 1 },   // imports as a map
}

type BodyContent = string | XjsExpression | XjsJsStatements | XjsJsBlock | XjsEvtListener;

const RX_DOUBLE_QUOTE = /\"/g,
    RX_START_CR = /^\n*/,
    RX_LOG = /\/\/\s*log\s*/,
    PARAMS_ARG = "$params",
    ASYNC = "async",
    NODE_NAMES = {
        "#tplFunction": "template function",
        "#tplArgument": "template argument",
        "#jsStatements": "javascript statements",
        "#jsBlock": "javascript block",
        "#fragment": "fragment",
        "#element": "element",
        "#component": "component",
        "#paramNode": "param node",
        "#decoratorNode": "decorator node",
        "#textNode": "text node",
        "#param": "param",
        "#property": "property",
        "#decorator": "decorator",
        "#reference": "reference",
        "#expression": "expression",
        "#number": "number",
        "#boolean": "boolean",
        "#string": "string",
        "#eventListener": "event listener"
    };

export async function compileTemplate(template: string, options: CompilationOptions): Promise<CompilationResult> {
    options.lineOffset = options.lineOffset || 0;
    let log = false;
    if (template.match(RX_LOG)) {
        log = true;
        template = template.replace(RX_LOG, "");
    }
    let root = await parse(template, options.filePath || "", options.lineOffset || 0);
    let res = generate(root, options);
    if (log) {
        let importMap = res.importMap || options.importMap, imports: string[] = []
        for (let k in importMap) {
            if (importMap.hasOwnProperty(k)) {
                imports.push(k);
            }
        }
        const separator = "-------------------------------------------------------------------------------"
        console.log(separator);
        console.log("imports: ", imports.join(", "));
        console.log("template: " + res.function);
        console.log(separator);
    }
    return res;
}

function generate(tf: XjsTplFunction, options: CompilationOptions) {
    let body: BodyContent[] = []; // parts composing the function body (generated strings + included expressions/statements)
    let root: ViewInstruction;

    return generateAll();

    function generateAll() {
        let gc = new GenerationCtxt(options), args = tf.arguments;
        if (args) {
            for (let i = 0; args.length > i; i++) {
                gc.templateArgs.push(args[i].name);
            }
        }

        if (tf.content) {
            root = new ViewInstruction("template", tf, 1, null, 0, gc, tf.indent);
            root.scan();
            root.pushCode(body);
        }

        let res: CompilationResult = {};
        if (options.function || options.body) {
            res.body = generateBody();
        }
        if (options.statics) {
            res.statics = gc.statics;
        }
        if (options.function) {
            res.function = templateStart(tf.indent, tf, gc) + res.body + templateEnd(tf);
        }
        if (options.imports) {
            res.importMap = gc.imports;
        }
        return res;
    }

    function generateBody(): string {
        let parts: string[] = [];
        for (let part of body) {
            if (typeof part === 'string') {
                parts.push(part);
            } else if (part.kind === "#expression" || part.kind === "#jsStatements" || part.kind === "#eventListener") {
                parts.push(part.code);
            } else if (part.kind === "#jsBlock") {
                parts.push(part.startCode.replace(RX_START_CR, ""));
            }
        }

        return "\n" + parts.join("") + reduceIndent(tf.indent);
    }
}

function reduceIndent(indent: string) {
    if (indent.length > 3) {
        return indent.slice(0, -4);
    }
    return indent;
}

export interface CompilationOptions {
    body?: boolean;                     // if true, will output the template function body in the result
    statics?: boolean;                  // if true, the statics array will be in the result
    function?: boolean;                 // if true the js function will be in the result
    imports?: boolean;                  // if true the imports will be added as comment to the js function
    importMap?: { [key: string]: 1 };   // imports as a map to re-use the map from a previous compilation
    filePath?: string;                  // file name - used for error reporting
    lineOffset?: number;                // shift error line count to report the line number of the file instead of the template
}

export class GenerationCtxt {
    indentIncrement = "    ";
    imports: { [key: string]: 1 };      // map of required imports
    statics: string[] = [];             // list of static resources
    localVars = {};                     // map of creation mode vars
    blockCount = 0;                     // number of js blocks - used to increment block variable suffixes
    templateArgs: string[] = [];        // name of template arguments

    constructor(public options: CompilationOptions) {
        this.imports = options.importMap || {};
    }

    error(msg, nd: XjsNode) {
        let fileInfo = this.options.filePath ? " in " + this.options.filePath : "",
            lineOffset = this.options.lineOffset || 0;
        throw new Error(`Invalid ${NODE_NAMES[nd.kind]} - ${msg} (line #${nd.lineNumber + lineOffset}${fileInfo})`);
    }

    decreaseIndent(indent: string) {
        let incLength = this.indentIncrement.length;
        if (indent.length > incLength) {
            return indent.substring(0, indent.length - incLength);
        } else {
            return indent;
        }
    }
}

enum ContainerType {
    Block = 1,
    Component = 2,
    Async = 3
}

function encodeText(t: string) {
    // todo replace double \\ with single \
    return '"' + t.replace(RX_DOUBLE_QUOTE, '\\"') + '"';
}

function templateStart(indent: string, tf: XjsTplFunction, gc: GenerationCtxt) {
    let lines: string[] = [], argNames = "", classDef = "", args = tf.arguments, argClassName = "", argInit: string[] = [];
    indent = reduceIndent(indent);

    function addImport(symbol: string) {
        gc.imports[symbol] = 1;
    }

    if (args && args.length) {
        let classProps: string[] = [], arg: XjsTplArgument;

        argNames = ", $";
        for (let i = 0; args.length > i; i++) {
            arg = args[i];
            if (i === 0 && arg.name === PARAMS_ARG) {
                argClassName = arg.typeRef || "";
            }
            if (arg.name === PARAMS_ARG) {
                argInit.push(PARAMS_ARG + ' = $');
            } else if (!argClassName) {
                argInit.push(arg.name + ' = $["' + arg.name + '"]')
                classProps.push((indent + gc.indentIncrement) + getPropertyDefinition({ name: arg.name }, "ζ", addImport));
            } else if (i > 0) {
                argInit.push(arg.name + ' = $["' + arg.name + '"]');
            }
        }
        if (!argClassName) {
            // default argument class definition
            argClassName = "ζParams";
            classDef = [indent, getClassDecorator("ζ", addImport), " class ζParams {\n", classProps.join("\n"), "\n", indent, "}"].join("");
        }
    }

    tf["argClassName"] = argClassName;
    lines.push('(function () {');
    if (gc.statics.length) {
        lines.push(`${indent}const ${gc.statics.join(", ")};`);
    }
    if (classDef) {
        lines.push(classDef);
    }
    gc.imports["ζt"] = 1;
    lines.push(`${indent}return ζt(function (ζ${argNames}) {`);
    if (argInit.length) {
        lines.push(`${indent + gc.indentIncrement}let ${argInit.join(", ")};`);
    }
    return lines.join("\n");
}

function templateEnd(tf: XjsTplFunction) {
    let argClassName = tf["argClassName"];
    if (argClassName) {
        return '}, 0, ' + argClassName + ');\n' + reduceIndent(tf.indent) + '})()';
    }
    return '});\n' + reduceIndent(tf.indent) + '})()';
}

// ---------------------------------------------------------------------------------

interface RuntimeInstruction {
    pushCode(body: BodyContent[]);
}

type ViewKind = "template" | "cptContent" | "paramContent" | "jsBlock" | "asyncBlock";

export class ViewInstruction implements RuntimeInstruction {
    gc: GenerationCtxt;
    nodeCount = 0;
    instructions: RuntimeInstruction[] = [];
    indent = '';
    prevKind = '';                          // kind of the previous sibling
    nextKind = '';                          // kind of the next sibling
    instanceCounterVar = '';                // e.g. ζi2 -> used to count sub-block instances
    blockIdx = 0;
    jsVarName = "ζ";                        // block variable name - e.g. ζ or ζ1
    cmVarName = "ζc";                       // creation mode var name - e.g. ζc or ζc1
    childBlockCreated: boolean[] = [];      // used to know if a block container has already been created
    childBlockIndexes: number[] = [];
    childViewIndexes: number[] = [];
    exprCount = 0;                          // binding expressions count
    expr1Count = 0;                         // one-time expressions count
    dExpressions: number[] = [];            // list of counters for deferred expressions (cf. ζexp)
    hasChildNodes = false;                  // true if the view has Child nodes
    hasParamNodes = false;
    asyncValue: number | XjsExpression = 0; // async priority
    cptIHolder: number = -1;                // iHolder of the component associated with this view
    cpnParentLevel: number = -1;            // component or pnode parent level

    constructor(public kind: ViewKind, public node: XjsTplFunction | XjsJsBlock | XjsElement | XjsFragment | XjsComponent, public idx: number, public parentView: ViewInstruction | null, public iHolder: number, generationCtxt?: GenerationCtxt, indent?: string) {
        if (parentView) {
            this.gc = parentView.gc;
            this.blockIdx = this.gc.blockCount++;
            if (this.kind === "cptContent" || this.kind === "paramContent") {
                // no instance var, no indent
                this.indent = parentView.indent;
                this.instanceCounterVar = '';
            } else if (this.kind === "asyncBlock") {
                this.gc.imports['ζasync'] = 1;
                this.indent = parentView.indent + this.gc.indentIncrement;
                this.instanceCounterVar = '';
            } else if (this.kind === "jsBlock") {
                this.indent = parentView.indent + this.gc.indentIncrement;
                this.instanceCounterVar = 'ζi' + this.blockIdx;
                this.gc.localVars[`${this.instanceCounterVar} = 0`] = 1;
                parentView.childViewIndexes.push(this.blockIdx); // used to reset instanceVar counters
            }
        } else if (generationCtxt) {
            this.indent = indent || '';
            this.gc = generationCtxt;
            this.blockIdx = this.gc.blockCount++;
            this.gc.imports['ζinit'] = 1;
            this.gc.imports['ζend'] = 1;
            this.gc.statics[0] = "ζs0 = {}"; // static object to hold cached values
        } else {
            throw new Error("ViewInstruction: either parentBlock or generationCtxt must be provided");
        }
        if (this.blockIdx > 0) {
            this.jsVarName = "ζ" + this.blockIdx;
            this.cmVarName = "ζc" + this.blockIdx;
        }

        if (this.blockIdx > 0) {
            // root block (idx 1) is passed as function argument
            this.gc.localVars[this.jsVarName] = 1;
            this.gc.localVars[this.cmVarName] = 1;
        }
    }

    scan() {
        if (this.kind === "asyncBlock") {
            this.generateInstruction([(this.node as any)], 0, 0, this.iHolder, this.prevKind, this.nextKind);
        } else {
            let content = this.node.content, len = content ? content.length : 0, nd: XjsContentNode;
            if (len === 0) return;

            let pLevel = 0;
            // creation mode
            if (len > 1) {
                // need container fragment if child nodes are not pnodes nor statements
                let count = 0, ch: XjsContentNode;
                for (let i = 0; len > i; i++) {
                    ch = content![i];
                    if (ch.kind !== "#jsStatements" && ch.kind !== "#paramNode") {
                        count++;
                        if (count > 1) break;
                    }
                }
                if (count > 1) {
                    this.nodeCount = 1;
                    this.instructions.push(new FraInstruction(null, 0, this, this.iHolder, pLevel));
                    FraInstruction
                    pLevel = 1;
                }
            }

            this.scanContent(content, pLevel, this.iHolder);
        }
        if (this.parentView && this.hasChildNodes) {
            this.gc.imports['ζview' + getIhSuffix(this.iHolder)] = 1;
            this.gc.imports['ζend' + getIhSuffix(this.iHolder)] = 1;
        }
    }

    scanContent(content: XjsContentNode[] | undefined, parentLevel: number, iHolder: number) {
        let pKind = "", nKind = "", len = content ? content.length : 0;
        for (let i = 0; len > i; i++) {
            nKind = (i < len - 1) ? content![i + 1].kind : "";
            this.generateInstruction(content!, i, parentLevel, iHolder, pKind, nKind);
            pKind = content![i].kind;
        }
    }

    generateInstruction(siblings: XjsContentNode[], siblingIdx: number, parentLevel: number, iHolder: number, prevKind: string, nextKind: string) {
        let nd: XjsContentNode = siblings[siblingIdx], content: XjsContentNode[] | undefined = undefined, idx = this.nodeCount;
        if (nd.kind !== "#jsStatements" && nd.kind !== "#paramNode") {
            this.nodeCount++;
            this.hasChildNodes = true;
        }

        let stParams = "", i1 = -1, i2 = -1, containsParamExpr = false;
        if (nd.kind === "#element" || nd.kind === "#component" || nd.kind === "#paramNode") {
            [i1, containsParamExpr] = this.registerStatics(nd.params);
            [i2] = this.registerStatics(nd.properties);
            if (i1 > -1 && i2 > -1) {
                stParams = `, ζs${i1}, ζs${i2}`;
            } else if (i1 > -1) {
                stParams = `, ζs${i1}`;
            } else if (i2 > -1) {
                stParams = `, ζu, ζs${i2}`;
            }
        }

        switch (nd.kind) {
            case "#textNode":
                this.rejectAsyncDecorator(nd as XjsText);
                this.instructions.push(new TxtInstruction(nd as XjsText, idx, this, iHolder, parentLevel));
                this.generateBuiltInDecoratorsInstructions(nd, idx, iHolder);
                break;
            case "#fragment":
                if (!this.processAsyncCase(nd as XjsFragment, idx, parentLevel, prevKind, nextKind)) {
                    this.instructions.push(new FraInstruction(nd, idx, this, iHolder, parentLevel));
                    this.generateBuiltInDecoratorsInstructions(nd, idx, iHolder);
                    content = nd.content;
                }
                break;
            case "#element":
                if (!this.processAsyncCase(nd as XjsElement, idx, parentLevel, prevKind, nextKind)) {
                    this.instructions.push(new EltInstruction(nd as XjsElement, idx, this, iHolder, parentLevel, stParams));
                    this.generateParamInstructions(nd as XjsElement, idx, iHolder, true, this);
                    this.generateBuiltInDecoratorsInstructions(nd as XjsElement, idx, iHolder);
                    this.createListeners(nd as XjsElement, idx, iHolder);
                    content = nd.content;
                }
                break;
            case "#component":
                if (!this.processAsyncCase(nd as XjsElement, idx, parentLevel, prevKind, nextKind)) {
                    // create a container block
                    let callImmediately = !containsParamExpr && (!nd.content || !nd.content.length);
                    let ci = new CptInstruction(nd as XjsComponent, idx, this, iHolder, parentLevel, callImmediately, i1)
                    this.instructions.push(ci);
                    if (containsParamExpr) {
                        this.generateParamInstructions(nd as XjsComponent, idx, iHolder, false, this);
                    }
                    if (nd.content && nd.content.length) {
                        let vi = new ViewInstruction("cptContent", nd as XjsComponent, idx, this, 1);
                        vi.cptIHolder = iHolder; // used by sub param Nodes to have the same value
                        vi.cpnParentLevel = parentLevel;
                        this.instructions.push(vi);
                        this.hasParamNodes = false;
                        vi.scan();
                        if (!vi.hasChildNodes && !this.hasParamNodes) {
                            callImmediately = true;
                            ci.callImmediately = true;
                        }
                        this.hasParamNodes = false;
                    }
                    if (!callImmediately) {
                        this.generateBuiltInDecoratorsInstructions(nd, idx, iHolder);
                        this.instructions.push(new CallInstruction(idx, this, iHolder));
                    }
                    // this.createContentFragment(nd as XjsComponent, nd as XjsComponent);
                    if (nd.listeners && nd.listeners.length) {
                        this.gc.error("Event listeners are not supported on components (yet)", nd);
                    }
                }
                break;
            case "#paramNode":
                // e.g. ζpnode(ζ, 3, 1, 0, "header");
                // logic close to #component
                this.rejectAsyncDecorator(nd as XjsParamNode);

                // pickup the closest parent view that is not a js block
                if (!this.parentView) {
                    this.gc.error("Param nodes cannot be defined at root level", nd); // TODO: this could change
                }
                let v: ViewInstruction = this, cptIHolder = 0, cpnParentLevel = 0;
                while (v) {
                    if (v.cptIHolder > -1) {
                        cptIHolder = v.cptIHolder;
                    }
                    if (v.cpnParentLevel > -1) {
                        cpnParentLevel = v.cpnParentLevel;
                    }
                    if (v.kind === "asyncBlock") {
                        this.gc.error("Param nodes cannot be defined in @async blocks", nd);
                    } else if (v.kind === "jsBlock" || v.kind === "paramContent") {
                        v = v.parentView!;
                    } else if (v.kind === "cptContent") {
                        v = v.parentView!;
                        break;
                    } else if (v.kind === "template") {
                        break;
                    } else {
                        this.gc.error("Param nodes cannot be defined in " + v.kind + " views", nd);
                    }
                }
                let newIdx = v.nodeCount++;
                v.hasParamNodes = true;

                let pi = new PndInstruction(nd as XjsParamNode, newIdx, v, cptIHolder, cpnParentLevel + 1, i1, this.indent)
                this.instructions.push(pi);
                if (containsParamExpr) {
                    this.generateParamInstructions(nd as XjsParamNode, newIdx, cptIHolder, false, v);
                }
                if (nd.content && nd.content.length) {
                    let vi = new ViewInstruction("paramContent", nd as XjsParamNode, newIdx, v, 1);
                    vi.cpnParentLevel = cpnParentLevel + 1;
                    this.instructions.push(vi);
                    vi.scan();
                }
                if (nd.listeners && nd.listeners.length) {
                    this.gc.error("Event listeners are not supported on param nodes (yet)", nd);
                }
                break;
            case "#jsStatements":
                this.instructions.push(new JsStatementsInstruction(nd, this, iHolder, prevKind));
                break;
            case "#jsBlock":
                if (!this.childBlockCreated[idx]) {
                    // create all adjacent block containers at once
                    let siblingNd: XjsContentNode, count = 0;
                    for (let i = siblingIdx; siblings.length > i; i++) {
                        siblingNd = siblings[i];
                        if (siblingNd.kind === "#jsBlock") {
                            this.instructions.push(new CntInstruction(idx + count, this, this.iHolder, parentLevel, ContainerType.Block));
                            this.childBlockCreated[idx + count] = true;
                        } else {
                            break;
                        }
                        count++;
                    }
                }
                this.childBlockIndexes.push(idx);
                let jsb = new ViewInstruction("jsBlock", nd, idx, this, this.iHolder ? this.iHolder + 1 : 0);
                jsb.prevKind = prevKind;
                jsb.nextKind = nextKind;
                this.instructions.push(jsb);
                jsb.scan();
                break;
        }

        if (content) {
            if (nd.kind === "#component") {
                // iHolder = nd as XjsComponent;
            } else if (nd.kind === "#paramNode") {
                // iHolder = nd as XjsParamNode;
            }

            this.scanContent(content, parentLevel + 1, iHolder);
        }
    }

    registerStatics(params: XjsParam[] | XjsProperty[] | undefined): [number, boolean] {
        // return the index of the static resource or -1 if none
        // 2nd param is true if dynamic expressions are found
        if (!params || !params.length) return [-1, false];
        let v: XjsNumber | XjsBoolean | XjsString | XjsExpression | undefined,
            sIdx = -1, val: string[] | undefined = undefined,
            p: XjsParam | XjsProperty,
            sVal = "",
            containsExpr = false,
            statics = this.gc.statics;
        for (let i = 0; params.length > i; i++) {
            p = params[i];
            v = p.value;
            sVal = ""
            if (p.kind === "#param" && p.isOrphan) {
                sVal = "true";
            } else if (v && v.kind !== "#expression") {
                if (v.kind === "#string") {
                    sVal = encodeText(v.value);
                } else {
                    sVal = "" + v.value;
                }
            } else if (v && v.kind === "#expression") {
                containsExpr = true;
            }
            if (sVal) {
                if (sIdx < 0) {
                    sIdx = statics.length;
                    val = [];
                }
                val!.push(encodeText(p.name));
                val!.push(sVal);
            }
        }
        if (val) {
            statics[sIdx] = "ζs" + sIdx + " = [" + val!.join(", ") + "]";
        }
        return [sIdx, containsExpr];
    }

    generateParamInstructions(f: XjsFragment, idx: number, iHolder: number, isAttribute: boolean, view: ViewInstruction) {
        // dynamic params / attributes
        if (f.params && f.params.length) {
            let len = f.params.length, p: XjsParam;
            for (let i = 0; len > i; i++) {
                p = f.params[i];
                if (p.value && p.value.kind === "#expression") {
                    this.instructions.push(new ParamInstruction(p, idx, view, iHolder, isAttribute, this.indent));
                }
            }
        }
        // dynamic properties
        if (f.properties && f.properties.length) {
            let len = f.properties.length, p: XjsProperty;
            for (let i = 0; len > i; i++) {
                p = f.properties[i];
                if (p.value && p.value.kind === "#expression") {
                    this.instructions.push(new ParamInstruction(p, idx, view, iHolder, isAttribute, this.indent));
                }
            }
        }
    }

    processAsyncCase(nd: XjsElement | XjsFragment, idx: number, parentLevel: number, prevKind: string, nextKind: string): boolean {
        // generate async block if @async decorator is used
        let asyncValue: number | XjsExpression = 0;

        if (nd === this.node) {
            return false; // we are in the async block for this node
        }

        // determine if an async decorator is used
        let decorators = nd.decorators;
        if (decorators) {
            for (let d of decorators) {
                if (d.ref.code === ASYNC) {
                    if (!d.hasDefaultPropValue) {
                        if (d.params) {
                            this.gc.error("Async decorator doesn't accept multiple params", d);
                        }
                        asyncValue = 1;
                        break;
                    } else {
                        let dv = d.defaultPropValue!;
                        // value can be number or expression
                        if (dv.kind === "#number") {
                            asyncValue = dv.value;
                        } else if (d.defaultPropValue!.kind === "#expression") {
                            asyncValue = dv as XjsExpression;
                        } else {
                            this.gc.error("@async value must be either empty or a number or an expression", d);
                        }
                    }
                }
            }
        }

        if (asyncValue) {
            // create an async container
            this.instructions.push(new CntInstruction(idx, this, this.iHolder, parentLevel, ContainerType.Async));
            let av = new ViewInstruction("asyncBlock", nd, idx, this, this.iHolder ? this.iHolder + 1 : 0);
            av.setAsync(asyncValue);
            av.prevKind = prevKind;
            av.nextKind = nextKind;
            this.instructions.push(av);
            av.scan();
            return true
        }
        return false;
    }

    setAsync(asyncValue: number | XjsExpression) {
        this.asyncValue = asyncValue;
    }

    generateBuiltInDecoratorsInstructions(nd: XjsComponent | XjsElement | XjsFragment | XjsText, idx: number, iHolder: number) {
        let d = nd.decorators;
        if (d) {
            let len = d.length, deco: XjsDecorator;
            for (let i = 0; len > i; i++) {
                deco = d[i];
                if (deco.ref && deco.ref.code === "content") {
                    if (nd.kind == "#textNode") {
                        this.gc.error("@content can not be used on text nodes", nd);
                    } else {
                        this.instructions.push(new InsInstruction(deco, nd, idx, this, iHolder));
                    }
                }
            }
        }
    }

    createListeners(nd: XjsElement, parentIdx: number, iHolder: number) {
        if (nd.listeners && nd.listeners.length) {
            for (let listener of nd.listeners) {
                this.instructions.push(new EvtInstruction(listener, this.nodeCount++, parentIdx, this, iHolder));
            }
        }
    }

    rejectAsyncDecorator(nd: XjsText | XjsParamNode) {
        let decorators = nd.decorators;
        if (decorators) {
            for (let d of decorators) {
                if (d.ref.code === "async") {
                    this.gc.error("@async cannot be used in this context", d);
                }
            }
        }
    }

    pushCode(body: BodyContent[]) {
        // e.g. 
        // let ζc = ζinit(ζ, ζs0, 3);
        // ...
        // ζend(ζ);

        let isJsBlock = this.node.kind === "#jsBlock";
        if (isJsBlock) {
            let p = this.parentView!, nd = this.node as XjsJsBlock;
            body.push((this.prevKind !== "#jsBlock" && this.prevKind !== "#jsStatements") ? this.gc.decreaseIndent(this.indent) : " ");
            body.push(nd);
            if (!nd.startCode.match(/\n$/)) {
                body.push("\n");
            }
        } else if (this.kind === "asyncBlock") {
            // async block
            let p = this.parentView!;
            body.push((this.prevKind !== "#jsBlock" && this.prevKind !== "#jsStatements") ? this.gc.decreaseIndent(this.indent) : " ");
            body.push(`${funcStart("async", this.iHolder)}${p.jsVarName}, ${this.iHolder}, ${this.idx}, `);
            if (typeof this.asyncValue === 'number') {
                body.push('' + this.asyncValue);
            } else {
                generateExpression(body, this.asyncValue as XjsExpression, p!, this.iHolder);
            }
            body.push(`, function () {\n`);
        }

        if (this.instructions.length) {
            let endArg = "";
            if (this.childBlockIndexes.length) {
                // block indexes need to be passed to the end statement
                let statics = this.gc.statics, csIdx = statics.length;
                statics.push("ζs" + csIdx + " = [" + this.childBlockIndexes.join(", ") + "]");
                endArg = ", ζs" + csIdx;
            }

            if (this.hasChildNodes) {
                let lastArgs = "", parentViewVarName = "ζ";
                if (!this.parentView) {
                    // root block: insert local variables
                    let arr: string[] = [], localVars = this.gc.localVars;
                    for (let k in localVars) if (localVars.hasOwnProperty(k)) {
                        arr.push(k);
                    }
                    arr.push(`ζc = ζinit(ζ, ζs0, ${this.nodeCount})`)
                    if (arr.length) {
                        body.push(`${this.indent}let ${arr.join(", ")};\n`);
                    }
                } else {
                    if (this.childViewIndexes.length) {
                        // reset child view indexes
                        body.push(`${this.indent}ζi${this.childViewIndexes.join(" = ζi")} = 0;\n`);
                    }
                    parentViewVarName = this.parentView.jsVarName;
                    lastArgs = this.instanceCounterVar ? ", ++" + this.instanceCounterVar : ", 0";
                }
                if (this.blockIdx > 0) {
                    // root block is initialized with ζinit
                    body.push(`${this.indent}${this.jsVarName} = ${funcStart("view", this.iHolder)}${parentViewVarName}, ${this.iHolder}, ${this.idx}, ${this.nodeCount}${lastArgs});\n`);
                    body.push(`${this.indent}${this.cmVarName} = ${this.jsVarName}.cm;\n`);
                }
            }

            for (let ins of this.instructions) {
                ins.pushCode(body);
            }

            if (this.hasChildNodes) {
                body.push(`${this.indent}${funcStart("end", this.iHolder)}${this.jsVarName}, ${this.cmVarName}${endArg});\n`);
            }
        }

        if (isJsBlock) {
            let nd = this.node as XjsJsBlock;
            body.push(this.gc.decreaseIndent(this.indent));
            body.push(nd.endCode);
            if (!nd.endCode.match(/\n$/) && this.nextKind !== "#jsBlock" && this.nextKind !== "#jsStatements") {
                body.push("\n");
            }
        } else if (this.kind === "asyncBlock") {
            // end of async function
            body.push(`${this.parentView!.indent}});\n`);
        }
    }
}

function generateExpression(body: BodyContent[], exp: XjsExpression | string, view: ViewInstruction, iHolder: number) {
    if (typeof (exp) !== "string" && exp.oneTime) {
        let ih = iHolder ? ", 1" : "";
        // e.g. ζo(ζ1, 0, ζc1? exp() : ζu, 2)
        body.push(`ζo(${view.jsVarName}, ${view.expr1Count++}, ${view.cmVarName}? `);
        body.push(exp); // to generate source map
        body.push(` : ζu${ih})`);
        view.gc.imports['ζo'] = 1;
        view.gc.imports['ζu'] = 1;
    } else {
        // e.g. ζe(ζ1, 2, expr())
        if (iHolder === 0) {
            body.push(`ζe(${view.jsVarName}, ${view.exprCount++}, `);
            body.push(exp); // to generate source map
            body.push(')');
        } else {
            // expression has to be deferred and cannot be immediately processed
            // so will be passed as an array: [0, getTitle()]
            // note: context nodes and instruction holder are already passed to the function
            // where the expression is used, this is why they don't need to be passed in the expression array
            if (view.dExpressions[iHolder] === undefined) {
                view.dExpressions[iHolder] = 0;
            } else {
                view.dExpressions[iHolder]++;
            }
            body.push(`[${view.dExpressions[iHolder]}, `);
            body.push(exp); // to generate source map
            body.push(`]`);
        }
        view.gc.imports['ζe'] = 1;
    }
}

function getIhSuffix(iHolder) {
    return iHolder ? "D" : "";
}

class TxtInstruction implements RuntimeInstruction {
    isStatic = true;            // true when the text doesn't contain expressions
    staticsExpr: string = '""'; // '" static string "' or "ζs1"

    constructor(public node: XjsText, public idx: number, public view: ViewInstruction, public iHolder: number, public parentLevel: number) {
        this.view.gc.imports['ζtxt' + getIhSuffix(iHolder)] = 1;

        let eLength = node.expressions ? node.expressions.length : 0;
        if (node.textFragments.length <= 1 && eLength === 0) {
            // static version
            this.staticsExpr = encodeText(node.textFragments[0]);

        } else {
            this.isStatic = false;

            // create static resource
            let gc = this.view.gc, staticsIdx = gc.statics.length, pieces: string[] = [], fLength = node.textFragments.length, eCount = 0;
            for (let i = 0; fLength > i; i++) {
                // todo eLength
                pieces.push(encodeText(node.textFragments[i]));
                if (eCount < eLength) {
                    pieces.push('""');
                    eCount++;
                }
            }
            gc.statics.push("ζs" + staticsIdx + " = [" + pieces.join(", ") + "]");
            this.staticsExpr = 'ζs' + staticsIdx;
        }
    }

    pushCode(body: BodyContent[]) {
        // e.g. ζtxt(ζ1, ζc1, 0, 2, 1, ζs0, 1, ζe(ζ, 0, 1, name));
        let v = this.view, eLength = this.node.expressions ? this.node.expressions.length : 0;

        body.push(`${v.indent}${funcStart("txt", this.iHolder)}${v.jsVarName}, ${v.cmVarName}, ${this.iHolder}, ${this.idx}, ${this.parentLevel}, ${this.staticsExpr}, ${eLength}`);
        for (let i = 0; eLength > i; i++) {
            body.push(', ');
            generateExpression(body, this.node.expressions![i], this.view, this.iHolder);
        }
        body.push(');\n');
    }
}

function funcStart(name: string, iHolder: number) {
    if (!iHolder) {
        return "ζ" + name + "(";
    } else {
        return "ζ" + name + "D(";
    }
}

class EltInstruction implements RuntimeInstruction {
    constructor(public node: XjsElement, public idx: number, public view: ViewInstruction, public iHolder: number, public parentLevel: number, public staticArgs: string) {
        this.view.gc.imports['ζelt' + getIhSuffix(iHolder)] = 1;
    }

    pushCode(body: BodyContent[]) {
        // e.g. ζelt(ζ1, ζc1, 0, 2, 1, "div", 0, ζs0, ζs1);
        let v = this.view;
        if (this.node.nameExpression) {
            v.gc.error("Name expressions are not yet supported", this.node);
        }
        let hasChildren = (this.node.content && this.node.content.length) ? 1 : 0;
        body.push(`${v.indent}${funcStart("elt", this.iHolder)}${v.jsVarName}, ${v.cmVarName}, ${this.idx}, ${this.parentLevel}, "${this.node.name}", ${hasChildren}${this.staticArgs});\n`);
    }
}

class FraInstruction implements RuntimeInstruction {
    constructor(public node: XjsFragment | null, public idx: number, public view: ViewInstruction, public iHolder: number, public parentLevel: number) {
        let gc = this.view.gc;
        if (node && node.params && node.params.length) {
            gc.error("Params cannot be used on fragments", node);
        }
        if (node && node.properties && node.properties.length) {
            gc.error("Properties cannot be used on fragments", node);
        }
        if (node && node.listeners && node.listeners.length) {
            gc.error("Event listeners cannot be used on fragments", node);
        }
        gc.imports['ζfra' + getIhSuffix(iHolder)] = 1;
    }

    pushCode(body: BodyContent[]) {
        let v = this.view;
        body.push(`${v.indent}${funcStart("fra", this.iHolder)}${v.jsVarName}, ${v.cmVarName}, ${this.idx}, ${this.parentLevel});\n`);
    }
}

class ParamInstruction implements RuntimeInstruction {
    funcName: "att" | "par" | "pro";

    constructor(public node: XjsParam | XjsProperty, public idx: number, public view: ViewInstruction, public iHolder: number, public isAttribute: boolean, public indent: string) {
        this.funcName = isAttribute ? "att" : "par"
        if (node.kind === "#property") {
            this.funcName = "pro";
        }
        this.view.gc.imports["ζ" + this.funcName + getIhSuffix(iHolder)] = 1;
    }

    pushCode(body: BodyContent[]) {
        // e.g. ζatt(ζ, 0, 1, "title", ζe(ζ, 0, exp()+123));
        let v = this.view, iSuffix = this.iHolder ? "D" : "";
        body.push(`${this.indent}ζ${this.funcName}${iSuffix}(${v.jsVarName}, ${this.iHolder ? 1 : 0}, ${this.idx}, "${this.node.name}", `);
        generateExpression(body, this.node.value as XjsExpression, this.view, this.iHolder);
        body.push(');\n');
    }
}

class JsStatementsInstruction implements RuntimeInstruction {
    constructor(public node: XjsJsStatements, public view: ViewInstruction, public iHolder: number, public prevKind: string) { }

    pushCode(body: BodyContent[]) {
        let v = this.view;
        body.push((this.prevKind !== "#jsBlock") ? v.indent : " ");
        body.push(this.node);
        if (!this.node.code.match(/\n$/)) {
            body.push("\n");
        }
    }
}

class CntInstruction implements RuntimeInstruction {
    constructor(public idx: number, public view: ViewInstruction, public iHolder: number, public parentLevel: number, public type: ContainerType) {
        view.gc.imports['ζcnt' + getIhSuffix(iHolder)] = 1;
    }

    pushCode(body: BodyContent[]) {
        let v = this.view;
        body.push(`${v.indent}${funcStart("cnt", this.iHolder)}${v.jsVarName}, ${v.cmVarName}, ${this.idx}, ${this.parentLevel}, ${this.type});\n`);
    }
}

class CptInstruction implements RuntimeInstruction {
    constructor(public node: XjsComponent, public idx: number, public view: ViewInstruction, public iHolder: number, public parentLevel: number, public callImmediately: boolean, public staticParamIdx: number) {
        view.gc.imports['ζcpt' + getIhSuffix(iHolder)] = 1;
        if (node.properties && node.properties.length) {
            view.gc.error("Properties cannot be used on components", node);
        }
    }

    pushCode(body: BodyContent[]) {
        // e.g. ζcpt(ζ, ζc, 2, 0, ζe(ζ, 0, alert), 1, ζs1);
        let v = this.view, stParams = (this.staticParamIdx === -1) ? '' : ', ζs' + this.staticParamIdx;

        body.push(`${v.indent}${funcStart("cpt", this.iHolder)}${v.jsVarName}, ${v.cmVarName}, ${this.iHolder}, ${this.idx}, ${this.parentLevel}, `);
        generateExpression(body, this.node.ref as XjsExpression, this.view, this.iHolder);
        body.push(`, ${this.callImmediately ? 1 : 0}${stParams});\n`);
    }
}

class PndInstruction implements RuntimeInstruction {
    constructor(public node: XjsParamNode, public idx: number, public view: ViewInstruction, public iHolder: number, public parentLevel: number, public staticParamIdx: number, public indent: string) {
        view.gc.imports['ζpnode' + getIhSuffix(iHolder)] = 1;
        if (node.properties && node.properties.length) {
            view.gc.error("Properties cannot be used on param nodes", node);
        }
        if (node.nameExpression) {
            view.gc.error("Param nodes names cannot be defined through expressions (yet)", node);
        }
    }

    pushCode(body: BodyContent[]) {
        // e.g. ζpnode(ζ, ζc, 2, 0, "header", ζs1);
        let v = this.view, stParams = (this.staticParamIdx === -1) ? '' : ', ζs' + this.staticParamIdx;
        body.push(`${this.indent}${funcStart("pnode", this.iHolder)}${v.jsVarName}, ${v.cmVarName}, ${this.iHolder}, ${this.idx}, ${this.parentLevel}, "${this.node.name}"${stParams});\n`);
    }
}

class CallInstruction implements RuntimeInstruction {
    constructor(public idx: number, public view: ViewInstruction, public iHolder: number) {
        view.gc.imports['ζcall' + getIhSuffix(iHolder)] = 1;
    }

    pushCode(body: BodyContent[]) {
        // e.g. ζcall(ζ, 2);
        let v = this.view;
        body.push(`${v.indent}${funcStart("call", this.iHolder)}${v.jsVarName}, ${this.idx});\n`);
    }
}

class EvtInstruction implements RuntimeInstruction {
    constructor(public listener: XjsEvtListener, public idx: number, public parentIdx, public view: ViewInstruction, public iHolder: number) {
        view.gc.imports['ζevt' + getIhSuffix(iHolder)] = 1;
    }

    pushCode(body: BodyContent[]) {
        // e.g. ζevt(ζ, ζc, 1, 0, function (e) {doSomething()});
        let v = this.view, listener = this.listener, args = "";
        if (listener.argumentNames) {
            args = listener.argumentNames.join(",");
        }
        body.push(`${v.indent}${funcStart("evt", this.iHolder)}${v.jsVarName}, ${v.cmVarName}, ${this.idx}, ${this.parentIdx}, "${listener.name}", function (${args}) {`);
        body.push(listener);
        body.push(`});\n`);
    }
}

class InsInstruction implements RuntimeInstruction {
    constructor(public node: XjsDecorator, parent: XjsComponent | XjsElement | XjsFragment, public idx: number, public view: ViewInstruction, public iHolder: number) {
        // manage @content built-in decorator
        let gc = this.view.gc;
        gc.imports['ζins' + getIhSuffix(iHolder)] = 1;
        if (parent.kind !== "#element" && parent.kind !== "#fragment") {
            gc.error("@content can only be used on elements or fragments", node);
        }
        if (parent.content && parent.content.length) {
            gc.error("@content can only be used on empty elements or fragments", node);
        }
    }

    pushCode(body: BodyContent[]) {
        // e.g. ζcont(ζ, 2, 0, ζe(ζ, 0, $content));
        let v = this.view, d = this.node, gc = this.view.gc;

        if (d.isOrphan || !d.defaultPropValue) {
            if (gc.templateArgs.indexOf("$content") < 0) {
                gc.error("$content must be defined as template argument to use @content without expressions", d);
            }
        } else if (this.node.defaultPropValue && this.node.defaultPropValue.kind !== "#expression") {
            gc.error("@content value cannot be a " + this.node.defaultPropValue.kind, d);
        } else if (this.node.defaultPropValue && this.node.defaultPropValue.kind === "#expression" && this.node.defaultPropValue.oneTime) {
            gc.error("@content expression cannot use one-time qualifier", d);
        }

        body.push(`${v.indent}${funcStart("ins", this.iHolder)}${v.jsVarName}, ${this.iHolder}, ${this.idx}, `);
        if (d.isOrphan || !d.defaultPropValue) {
            generateExpression(body, '$content', this.view, this.iHolder);
        } else {
            generateExpression(body, this.node.defaultPropValue as XjsExpression, this.view, this.iHolder);
        }
        body.push(`);\n`);
    }
}