
export const
    A_NAME = "entity.other.attribute-name.js.xjs",
    ARROW = "storage.type.function.arrow.ts",
    ARROW_FUNCTION = "meta.arrow.ts",
    ASSIGNMENT = "keyword.operator.assignment.ts",
    ATT = "tag.attribute.assignment",
    ATT1 = "tag.attribute",
    ATT_EXPR = "entity.other.attribute.param.shortcut.js.xjs",
    ATT_SPREAD = "entity.other.attribute.param.spread.js.xjs",
    BLOCK = "meta.block.ts",
    BLOCK_ATT = "meta.block.attributes.ts",
    B_DEF = "punctuation.definition.block.ts",
    B_START = "punctuation.section.embedded.begin.js.xjs",
    B_END = "punctuation.section.embedded.end.js.xjs",
    BRACE_SQ = "meta.brace.square.ts",
    COMMA = "punctuation.separator.comma.ts",
    COMMENT = "comment.block.ts",
    COMMENT1 = "comment.line.double-slash.ts",
    CONTENT = "content",
    C_DEF = "punctuation.definition.comment.ts",
    C_WS = "punctuation.whitespace.comment.leading.ts",
    DECIMAL_PERIOD = "meta.delimiter.decimal.period.ts",
    DECO = "tag.attribute.decorator.assignment",
    DECO1 = "entity.other.attribute.decorator.js.xjs",
    D_DEF = "punctuation.section.embedded.decorator.js.xjs",
    D_END = "punctuation.section.embedded.decorator.end.js.xjs",
    D_START = "punctuation.section.embedded.decorator.begin.js.xjs",
    EQ = "keyword.operator.assignment.js.xjs",
    EXP_MOD = "punctuation.section.embedded.modifier.js.xjs",
    F_CALL = "meta.function-call.ts",
    FALSE = "constant.language.boolean.false.ts",
    MOD = "entity.name.type.module.ts",
    V_ACC = "punctuation.accessor.ts",
    NUM = "constant.numeric.decimal.ts",
    PARAM = "meta.parameters.ts",
    PARAM_OPTIONAL = "keyword.operator.optional.ts",
    PR = "tag.attribute.property.assignment",
    P_START = "punctuation.definition.parameters.begin.ts",
    P_VAR = "variable.parameter.ts",
    P_END = "punctuation.definition.parameters.end.ts",
    PR_END = "punctuation.section.embedded.property.end.js.xjs",
    PR_START = "punctuation.section.embedded.property.begin.js.xjs",
    PR_EXPR = "entity.other.attribute.property.shortcut.js.xjs",
    PR_SPREAD = "entity.other.attribute.property.spread.js.xjs",
    LBL = "entity.other.attribute.label.js.xjs",
    LBL_DEF = "punctuation.section.embedded.label.js.xjs",
    SEP = "punctuation.separator.parameter.ts",
    STR_D = "string.quoted.double.ts",
    STR_S = "string.quoted.single.ts",
    S_START = "punctuation.definition.string.begin.ts",
    S_END = "punctuation.definition.string.end.ts",
    TAG = "meta.tag.js.xjs",
    T_CLOSE = "punctuation.definition.tag.close.js.xjs",
    T_END = "punctuation.definition.tag.end.js.xjs",
    T_NAME = "entity.name.tag.js.xjs",
    T_PREFIX = "entity.name.tag.prefix.js.xjs",
    T_START = "punctuation.definition.tag.begin.js.xjs",
    TRUE = "constant.language.boolean.true.ts",
    TUPLE = "meta.type.tuple.ts",
    TYPE_AN = "meta.type.annotation.ts",
    TYPE_ENTITY = "entity.name.type.ts",
    TYPE_PRIMITIVE = "support.type.primitive.ts",
    TYPE_SEP = "keyword.operator.type.annotation.ts",
    TXT = "string.xjs.text.node.ts",
    TXT_START = "punctuation.definition.string.begin.js.xjs",
    TXT_END = "punctuation.definition.string.end.js.xjs",
    V_RW = "variable.other.readwrite.ts";

export const SCOPES = {
    "tag.attribute": "ATT1",
    "tag.attribute.assignment": "ATT",
    "entity.other.attribute-name.js.xjs": "A_NAME",
    "entity.other.attribute.param.shortcut.js.xjs": "ATT_EXPR",
    "entity.other.attribute.param.spread.js.xjs": "ATT_SPREAD",

    "keyword.operator.optional.ts": "PARAM_OPTIONAL",
    "keyword.operator.assignment.ts": "ASSIGNMENT",

    "meta.arrow.ts": "ARROW_FUNCTION",
    "meta.delimiter.decimal.period.ts": "DECIMAL_PERIOD",
    "meta.type.tuple.ts": "TUPLE",
    "meta.brace.square.ts": "BRACE_SQ",
    "storage.type.function.arrow.ts": "ARROW",

    "meta.block.ts": "BLOCK",
    "meta.block.attributes.ts": "BLOCK_ATT",
    "punctuation.definition.block.ts": "B_DEF",
    "punctuation.section.embedded.begin.js.xjs": "B_START",
    "punctuation.section.embedded.end.js.xjs": "B_END",
    "meta.brace.round.ts": "BRACE_R",

    "punctuation.separator.comma.ts": "COMMA",
    "comment.block.ts": "COMMENT",
    "comment.line.double-slash.ts": "COMMENT1",
    "punctuation.definition.comment.ts": "C_DEF",
    "punctuation.whitespace.comment.leading.ts": "C_WS",
    "content": "CONTENT",

    "entity.other.attribute.decorator.js.xjs": "DECO1",
    "tag.attribute.decorator.assignment": "DECO",
    "punctuation.section.embedded.decorator.js.xjs": "D_DEF",
    "punctuation.section.embedded.decorator.begin.js.xjs": "D_START",
    "punctuation.section.embedded.decorator.end.js.xjs": "D_END",

    "constant.character.escape.ts": "ESC",
    "constant.character.entity.js.xjs": "ENTITY",
    "punctuation.section.embedded.modifier.js.xjs": "EXP_MOD",
    "keyword.operator.assignment.js.xjs": "EQ",

    "meta.function-call.ts": "F_CALL",
    "entity.name.function.ts": "F_NAME",

    "constant.numeric.decimal.ts": "NUM",
    "entity.name.type.module.ts": "MOD",

    "keyword.operator.arithmetic.ts": "OP",

    "variable.other.property.ts": "PROP",
    "meta.parameters.ts": "PARAM",
    "punctuation.definition.parameters.begin.ts": "P_START",
    "punctuation.definition.parameters.end.ts": "P_END",
    "variable.parameter.ts": "P_VAR",
    "tag.attribute.property.assignment": "PR",
    "punctuation.section.embedded.property.begin.js.xjs": "PR_START",
    "punctuation.section.embedded.property.end.js.xjs": "PR_END",
    "entity.other.attribute.property.shortcut.js.xjs": "PR_EXPR",
    "entity.other.attribute.property.spread.js.xjs": "PR_SPREAD",

    "entity.other.attribute.label.js.xjs": "LBL",
    "punctuation.section.embedded.label.js.xjs": "LBL_DEF",
    "entity.other.attribute.ref.js.xjs": "REF",
    "punctuation.section.embedded.ref.js.xjs": "R_DEF",
    "punctuation.section.embedded.ref.collection.js.xjs": "R_COL",
    "punctuation.section.embedded.ref.collection.start.js.xjs": "R_COL_START",
    "punctuation.section.embedded.ref.collection.end.js.xjs": "R_COL_END",

    "source.ts": "S",
    "string.quoted.double.ts": "STR_D",
    "string.quoted.single.ts": "STR_S",
    "punctuation.definition.string.begin.ts": "S_START",
    "punctuation.definition.string.end.ts": "S_END",
    "punctuation.separator.parameter.ts": "SEP",
    "punctuation.terminator.statement.ts": "TERM",

    "meta.tag.js.xjs": "TAG",
    "entity.name.tag.js.xjs": "T_NAME",
    "entity.name.tag.prefix.js.xjs": "T_PREFIX",
    "punctuation.definition.tag.begin.js.xjs": "T_START",
    "punctuation.definition.tag.end.js.xjs": "T_END",
    "punctuation.definition.tag.close.js.xjs": "T_CLOSE",
    "string.xjs.text.node.ts": "TXT",
    "punctuation.definition.string.begin.js.xjs": "TXT_START",
    "punctuation.definition.string.end.js.xjs": "TXT_END",
    "constant.language.boolean.true.ts": "TRUE",

    "meta.type.annotation.ts": "TYPE_AN",
    "entity.name.type.ts": "TYPE_ENTITY",
    "keyword.operator.type.annotation.ts": "TYPE_SEP",
    "support.type.primitive.ts": "TYPE_PRIMITIVE",

    "variable.other.object.ts": "VAR",
    "variable.other.readwrite.ts": "V_RW",
    "punctuation.accessor.ts": "V_ACC"
}