module.exports = grammar({
    name: 'dezyne',

    extras: $ => [$.comment, /\s+/],

    word: $ => $.identifier,

    rules: {
        root: $ => repeat($.root_statement),

        root_statement: $ => choice(
            $.import,
            $.dollars,
            $.type,
            $.namespace,
            $.interface,
            // $.component,
            seq('test', '(', $.expression, ')', ';'),
        ),

        import: $ => seq('import', $.file_name, ';'),
        file_name: $ => /[^\s][^;]*/,

        dollars: $ => seq('$', $.dollars_content, '$'),
        dollars_content: $ => /[^\$]*/,

        type: $ => choice(
            $.enum,
            $.int,
            $.extern,
        ),

        enum: $ => seq('enum', $.scoped_name, '{', $.fields, '}', ';'),
        fields: $ => seq($.name, repeat(seq(',', $.name)), optional(',')),

        int: $ => seq('subint', $.scoped_name, '{', $.range, '}', ';'),
        range: $ => seq($.number, '..', $.number),

        extern: $ => seq('extern', $.scoped_name, $.dollars, ';'),

        namespace: $ => seq('namespace', $.compound_name, '{', repeat($.namespace_statement), '}'),

        namespace_statement: $ => choice(
            $.type,
            $.namespace,
            $.interface,
            // $.component,
        ),

        interface: $ => seq('interface', $.scoped_name, '{', repeat($.interface_statement), $.behavior, '}'),

        interface_statement: $ => choice(
            $.type,
            $.event,
        ),

        event: $ => seq($.direction, $.type_name, $.event_name, $.formals, ';'),
        direction: $ => choice('in', 'out'),

        type_name: $ => choice($.compound_name, 'bool', 'void'),

        behavior: $ => seq('behavior', optional($.name), '{', repeat($.behavior_statement), '}'),

        behavior_statement: $ => choice(
            $.function,
            $.variable,
            // $.declarative_statement,
            $.type,
        ),

        function: $ => seq($.type_name, $.name, $.formals, $.compound),

        variable: $ => seq($.type_name, $.var_name, optional(seq('=', $.expression)), ';'),

        event_name: $ => $.identifier,

        formals: $ => seq('(', optional(seq($.formal, repeat(seq(',', $.formal)))), ')'),
        formal: $ => seq(optional(choice('in', 'out', 'inout')), $.type_name, $.var_name),

        var_name: $ => $.identifier,

        compound : $ => seq('{', repeat($.statement), '}'),

        statement: $ => choice(
            // $.declarative_statement,
            $.imperative_statement,
        ),

        imperative_statement: $ => choice(
            $.variable,
            // $.assign,
            // $.if_statement,
            // $.illegal,
            // $.return,
            // $.skip_statement,
            $.compound,
            // $.reply,
            // $.defer,
            // $.action_or_call,
            // $.interface_action,
        ),

        call: $ => seq($.name, $.arguments),
        arguments: $ => seq('(', optional(seq($.expression, repeat(seq(',', $.expression)))), ')'),

        expression: $ => choice(
            $.unary_expression,
            $.group,
            $.dollars,
            $.literal,
            $.compound_name,
            $.call,
            // $.interface_action,
            $.binary_expression,
        ),
        group: $ => seq('(', $.expression, ')'),
        literal: $ => choice($.number, 'true', 'false'),

        unary_expression: $ => prec(2, choice(
            seq('!', $.expression),
            seq('-', $.expression),
        )),

        binary_expression: $ => choice(
            prec.left(seq($.expression, '||', $.expression)),
            prec.left(seq($.expression, '&&', $.expression)),
            prec.left(seq($.expression, '<', $.expression)),
            prec.left(seq($.expression, '<=', $.expression)),
            prec.left(seq($.expression, '==', $.expression)),
            prec.left(seq($.expression, '!=', $.expression)),
            prec.left(seq($.expression, '>=', $.expression)),
            prec.left(seq($.expression, '>', $.expression)),
            prec.left(seq($.expression, '+', $.expression)),
            prec.left(seq($.expression, '-', $.expression)),
        ),

        compound_name: $ => seq(
            optional($.global),
            seq($.identifier, repeat(seq('.', $.identifier)))
        ),

        global: $ => '.',

        name: $ => $.identifier,

        scoped_name: $ => $.identifier,

        identifier: $ => /[a-zA-Z][a-zA-Z0-9]*/,

        number: $ => /-?[0-9]+/,

        comment: $ => choice(
            seq('//', /(\\+(.|\r?\n)|[^\\\n])*/),
            seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/'),
        ),
    }
});
